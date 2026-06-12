"""
Telegram notification — uses the Bot API directly via httpx (no extra library needed).
Setup: create a bot with @BotFather, get the token and your chat_id.
"""
import httpx
from loguru import logger
from app.core.config import settings
from app.models.job import JobListing


def _format_job(job: JobListing, rank: int) -> str:
    score_str = f"{job.match_score:.0f}%" if job.match_score else "?"
    easy = " ⚡ Easy Apply" if job.is_easy_apply else ""
    return (
        f"*{rank}. {job.title}*\n"
        f"🏢 {job.company} | 📍 {job.location or 'N/A'}\n"
        f"🎯 Match: {score_str}{easy}\n"
        f"🔗 [Apply]({job.url})"
    )


async def send_job_digest(jobs: list[JobListing]) -> bool:
    """Send top job matches to Telegram. Returns True on success."""
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
        logger.warning("Telegram not configured — set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env")
        return False

    if not jobs:
        return False

    lines = ["🚀 *Career Pilot — Daily Job Digest*\n"]
    for i, job in enumerate(jobs[:10], start=1):
        lines.append(_format_job(job, i))
        lines.append("")

    lines.append(f"_Showing top {len(jobs[:10])} matches. Open Career Pilot to apply._")
    message = "\n".join(lines)

    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": settings.TELEGRAM_CHAT_ID,
        "text": message,
        "parse_mode": "Markdown",
        "disable_web_page_preview": True,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            logger.info(f"Telegram digest sent: {len(jobs)} jobs")
            return True
    except Exception as e:
        logger.error(f"Telegram send failed: {e}")
        return False
