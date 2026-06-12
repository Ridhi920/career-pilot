"""
Job scraper: LinkedIn public job listings + Naukri API.
No login required — uses publicly accessible endpoints.
"""
import asyncio
import re
import httpx
from datetime import datetime, timedelta, timezone
from bs4 import BeautifulSoup
from loguru import logger

# Only keep postings from the last 2 months
MAX_POSTING_AGE_DAYS = 60

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


# ─── LinkedIn ─────────────────────────────────────────────────────────────────

def _parse_linkedin_card(card: BeautifulSoup) -> dict | None:
    try:
        title_el = card.select_one(".base-search-card__title")
        company_el = card.select_one(".base-search-card__subtitle")
        location_el = card.select_one(".job-search-card__location")
        link_el = card.select_one("a.base-card__full-link") or card.select_one("a[href*='/jobs/view/']")

        if not title_el or not link_el:
            return None

        url: str = link_el.get("href", "")
        # Strip tracking params
        url = url.split("?")[0]

        easy_apply = bool(card.select_one(".job-search-card__easy-apply-label") or
                          card.find(string=re.compile("Easy Apply", re.I)))

        posted_at = None
        time_el = card.select_one("time[datetime]")
        if time_el:
            try:
                posted_at = datetime.strptime(time_el["datetime"], "%Y-%m-%d").replace(tzinfo=timezone.utc)
            except (ValueError, KeyError):
                pass

        return {
            "title": title_el.get_text(strip=True),
            "company": company_el.get_text(strip=True) if company_el else "",
            "location": location_el.get_text(strip=True) if location_el else "",
            "url": url,
            "source": "linkedin",
            "is_easy_apply": easy_apply,
            "description": None,
            "posted_at": posted_at,
        }
    except Exception:
        return None


async def _fetch_linkedin_description(client: httpx.AsyncClient, url: str) -> str:
    try:
        resp = await client.get(url, timeout=15)
        soup = BeautifulSoup(resp.text, "html.parser")
        desc = soup.select_one(".description__text") or soup.select_one(".show-more-less-html__markup")
        if desc:
            return desc.get_text(separator="\n", strip=True)[:3000]
    except Exception:
        pass
    return ""


async def scrape_linkedin(query: str, location: str, num_jobs: int = 20) -> list[dict]:
    jobs: list[dict] = []
    start = 0
    batch = 10

    async with httpx.AsyncClient(headers=_HEADERS, follow_redirects=True, timeout=20) as client:
        while len(jobs) < num_jobs:
            url = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
            params = {
                "keywords": query,
                "location": location,
                "start": start,
                "count": batch,
                # f_TPR = time posted range in seconds; sortBy=DD = most recent first
                "f_TPR": f"r{MAX_POSTING_AGE_DAYS * 86400}",
                "sortBy": "DD",
            }

            try:
                resp = await client.get(url, params=params)
                soup = BeautifulSoup(resp.text, "html.parser")
                cards = soup.select("li")
                if not cards:
                    break
                for card in cards:
                    job = _parse_linkedin_card(card)
                    if job:
                        jobs.append(job)
            except Exception as e:
                logger.warning(f"LinkedIn scrape batch failed: {e}")
                break

            start += batch
            if len(cards) < batch:
                break
            await asyncio.sleep(1.5)

        # Fetch descriptions concurrently (max 5 at a time)
        sem = asyncio.Semaphore(5)

        async def enrich(job: dict) -> None:
            async with sem:
                job["description"] = await _fetch_linkedin_description(client, job["url"])
                await asyncio.sleep(0.5)

        await asyncio.gather(*[enrich(j) for j in jobs[:num_jobs]])

    logger.info(f"LinkedIn: scraped {len(jobs[:num_jobs])} jobs for '{query}' in '{location}'")
    return jobs[:num_jobs]


# ─── Naukri ───────────────────────────────────────────────────────────────────

async def scrape_naukri(query: str, location: str, num_jobs: int = 20) -> list[dict]:
    """Uses Naukri's public job search API (no login required)."""
    headers = {
        **_HEADERS,
        "Accept": "application/json",
        "appid": "109",
        "systemid": "Naukri",
    }
    params = {
        "noOfResults": num_jobs,
        "urlType": "search_by_keyword",
        "searchType": "adv",
        "keyword": query,
        "location": location,
        "pageNo": 1,
        "sort": "f",  # freshness — most recent postings first
    }

    jobs: list[dict] = []
    async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=20) as client:
        try:
            resp = await client.get(
                "https://www.naukri.com/jobapi/v2/search",
                params=params,
            )
            if resp.status_code != 200:
                logger.warning(f"Naukri API returned {resp.status_code}")
                return []
            data = resp.json()
            for item in data.get("list", [])[:num_jobs]:
                title = (item.get("post") or "").strip()
                if not title:
                    continue
                job_id = item.get("jobId", "")
                url = item.get("urlStr") or f"https://www.naukri.com/job-listings-{job_id}"

                desc_parts = []
                if item.get("jobDesc"):
                    desc_parts.append(BeautifulSoup(item["jobDesc"], "html.parser").get_text(separator="\n", strip=True))
                if item.get("keywords"):
                    desc_parts.append("Skills: " + item["keywords"])

                # cityfield mixes the location with SEO filler, separated by double spaces
                city = (item.get("cityfield") or "").split("  ")[0].strip()

                posted_at = None
                created = item.get("createdDate")
                if isinstance(created, (int, float)) and created > 0:
                    posted_at = datetime.fromtimestamp(created / 1000, tz=timezone.utc)

                jobs.append({
                    "title": title,
                    "company": item.get("companyName") or item.get("hiringFor", ""),
                    "location": city or location,
                    "url": url,
                    "source": "naukri",
                    "is_easy_apply": False,
                    "description": "\n".join(desc_parts)[:3000] if desc_parts else "",
                    "posted_at": posted_at,
                })
        except Exception as e:
            logger.warning(f"Naukri scrape failed: {e}")

    logger.info(f"Naukri: scraped {len(jobs)} jobs for '{query}' in '{location}'")
    return jobs


# ─── Entry point ──────────────────────────────────────────────────────────────

async def discover_jobs(
    query: str,
    location: str,
    sources: list[str],
    num_jobs: int = 20,
) -> list[dict]:
    per_source = max(1, num_jobs // len(sources))
    tasks = []
    if "linkedin" in sources:
        tasks.append(scrape_linkedin(query, location, per_source))
    if "naukri" in sources:
        tasks.append(scrape_naukri(query, location, per_source))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    combined: list[dict] = []
    for r in results:
        if isinstance(r, list):
            combined.extend(r)
        else:
            logger.error(f"Scraper error: {r}")

    # Drop postings older than the cutoff (keep ones with unknown dates),
    # then sort newest first — unknown dates go last.
    cutoff = datetime.now(timezone.utc) - timedelta(days=MAX_POSTING_AGE_DAYS)
    fresh = [j for j in combined if j.get("posted_at") is None or j["posted_at"] >= cutoff]
    dropped = len(combined) - len(fresh)
    if dropped:
        logger.info(f"Filtered out {dropped} jobs older than {MAX_POSTING_AGE_DAYS} days")

    fresh.sort(
        key=lambda j: j.get("posted_at") or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    return fresh[:num_jobs]
