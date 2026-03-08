import os
from datetime import datetime, timezone

from fastapi import APIRouter, Response

router = APIRouter(tags=["seo"])


@router.get("/robots.txt", response_class=Response)
def robots_txt():
    content = "\n".join([
        "User-agent: *",
        "Allow: /",
        "Disallow: /chats",
        "Disallow: /profile",
        "Disallow: /admin",
        "Disallow: /forbidden",
        "Disallow: /auth",
        "Sitemap: {}/sitemap.xml".format(os.getenv("PUBLIC_BASE_URL", "http://localhost:8000")),
    ])
    return Response(content=content, media_type="text/plain")


@router.get("/sitemap.xml", response_class=Response)
def sitemap_xml():
    frontend_base = os.getenv("PUBLIC_FRONTEND_URL", "http://localhost:3000")
    now = datetime.now(timezone.utc).date().isoformat()

    entries = [
        {"loc": f"{frontend_base}/about", "priority": "1.0", "changefreq": "weekly"},
        {"loc": f"{frontend_base}/login", "priority": "0.8", "changefreq": "monthly"},
        {"loc": f"{frontend_base}/register", "priority": "0.8", "changefreq": "monthly"},
    ]

    urlset = "".join([
        (
            "<url>"
            f"<loc>{entry['loc']}</loc>"
            f"<lastmod>{now}</lastmod>"
            f"<changefreq>{entry['changefreq']}</changefreq>"
            f"<priority>{entry['priority']}</priority>"
            "</url>"
        )
        for entry in entries
    ])

    xml = (
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
        "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">"
        f"{urlset}"
        "</urlset>"
    )
    return Response(content=xml, media_type="application/xml")
