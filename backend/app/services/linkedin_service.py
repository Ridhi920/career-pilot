"""
LinkedIn applied-jobs sync via Playwright.
Opens a visible browser so the user can see and intervene if needed.
"""
import asyncio
import re
from loguru import logger

_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

APPLIED_JOBS_URL = "https://www.linkedin.com/my-items/saved-jobs/?cardType=APPLIED"


async def _linkedin_login(page, email: str, password: str) -> bool:
    """Log into LinkedIn. Returns True once the feed loads (waits for manual CAPTCHA/2FA)."""
    from playwright.async_api import TimeoutError as PWTimeout

    logger.info("LinkedIn: logging in...")
    await page.goto("https://www.linkedin.com/login", wait_until="networkidle")
    await page.fill("#username", email)
    await page.fill("#password", password)
    await page.click("button[type='submit']")

    try:
        await page.wait_for_url("**/feed**", timeout=15000)
        return True
    except PWTimeout:
        logger.warning("LinkedIn login: may need manual CAPTCHA/2FA — waiting 30s for user...")
        await asyncio.sleep(30)
        return "feed" in page.url


async def linkedin_fetch_applied_jobs(
    linkedin_email: str,
    linkedin_password: str,
    limit: int = 30,
    headless: bool = False,
) -> dict:
    """
    Scrape the user's own 'Applied jobs' list from LinkedIn My Items.
    Returns {"status": "ok"|"failed"|"manual_needed", "jobs": [{title, company, url, applied_text}], "message": "..."}
    """
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        return {"status": "failed", "jobs": [], "message": "Playwright not installed. Run: playwright install chromium"}

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=headless,
            args=["--disable-blink-features=AutomationControlled"],
        )
        context = await browser.new_context(
            user_agent=_USER_AGENT,
            viewport={"width": 1280, "height": 800},
        )
        page = await context.new_page()

        try:
            if not await _linkedin_login(page, linkedin_email, linkedin_password):
                await browser.close()
                return {"status": "manual_needed", "jobs": [], "message": "LinkedIn login requires CAPTCHA or 2FA."}

            logger.info("LinkedIn sync: opening applied jobs list...")
            await page.goto(APPLIED_JOBS_URL, wait_until="domcontentloaded")
            await asyncio.sleep(3)

            jobs: dict[str, dict] = {}  # keyed by LinkedIn job id
            for _ in range(5):  # scroll to load more cards
                anchors = page.locator("a[href*='/jobs/view/']")
                for i in range(await anchors.count()):
                    anchor = anchors.nth(i)
                    href = await anchor.get_attribute("href") or ""
                    match = re.search(r"/jobs/view/(\d+)", href)
                    if not match or match.group(1) in jobs:
                        continue
                    job_view_id = match.group(1)

                    title = (await anchor.inner_text()).strip().splitlines()[0].strip()
                    company = ""
                    applied_text = ""
                    card = anchor.locator("xpath=ancestor::li[1]")
                    if await card.count():
                        lines = [l.strip() for l in (await card.inner_text()).splitlines() if l.strip()]
                        # Card lines are typically: Title, Company, Location, "Applied Xd ago"
                        for line in lines:
                            if line.lower().startswith("applied"):
                                applied_text = line
                            elif line != title and not company:
                                company = line
                    if not title:
                        continue

                    jobs[job_view_id] = {
                        "title": title,
                        "company": company,
                        "url": f"https://www.linkedin.com/jobs/view/{job_view_id}/",
                        "job_view_id": job_view_id,
                        "applied_text": applied_text,
                    }
                    if len(jobs) >= limit:
                        break

                if len(jobs) >= limit:
                    break
                await page.keyboard.press("End")
                await asyncio.sleep(2)

            await browser.close()
            logger.info(f"LinkedIn sync: found {len(jobs)} applied jobs")
            return {"status": "ok", "jobs": list(jobs.values()), "message": f"Found {len(jobs)} applied jobs."}

        except Exception as e:
            logger.error(f"LinkedIn applied-jobs sync failed: {e}")
            try:
                await browser.close()
            except Exception:
                pass
            return {"status": "failed", "jobs": [], "message": str(e)}
