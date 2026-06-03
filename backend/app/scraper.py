from __future__ import annotations

import re
import time
from dataclasses import dataclass, replace
from math import asin, cos, radians, sin, sqrt
from typing import Callable, Iterable
from urllib.parse import quote_plus

MAPS_SEARCH_BASE_URL = "https://www.google.com/maps/search"


class ScraperError(RuntimeError):
    pass


@dataclass(frozen=True)
class LeadData:
    place_id: str
    name: str
    address: str = ""
    phone: str = ""
    website: str = ""
    google_maps_url: str = ""
    rating: float | None = None
    review_count: int | None = None
    latitude: float | None = None
    longitude: float | None = None
    distance_meters: int | None = None


# on_lead(lead) -> True means "stop scraping"
OnLeadCallback = Callable[[LeadData], bool]


def scrape_google_maps(
    query: str,
    *,
    lat: float | None = None,
    lng: float | None = None,
    radius: float | None = None,
    max_results: int = 50,
    scrolls: int = 20,
    timeout_seconds: float = 30.0,
    delay_seconds: float = 0.4,
    headless: bool = True,
    on_lead: OnLeadCallback | None = None,
) -> list[LeadData]:
    try:
        from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        raise ScraperError("Playwright is not installed.") from exc

    url = build_maps_search_url(query, lat, lng, radius)
    timeout_ms = int(timeout_seconds * 1000)
    leads: list[LeadData] = []
    seen_urls: set[str] = set()

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=headless)
        page = browser.new_page(locale="en-US")
        page.set_default_timeout(timeout_ms)

        try:
            page.goto(url, wait_until="domcontentloaded")
            _accept_consent_if_present(page)
            _wait_for_results_or_place(page)
            candidate_limit = _candidate_limit(max_results, radius)
            links = _collect_place_links(page, max_results=candidate_limit, scrolls=scrolls, delay_seconds=delay_seconds)

            if not links and _looks_like_place_page(page.url):
                links = [page.url]

            for link in links:
                try:
                    page.goto(link, wait_until="domcontentloaded")
                    _wait_for_place_panel(page)
                    lead = _extract_place(page)
                    lead = _with_distance(lead, lat, lng)

                    key = lead.google_maps_url or f"{lead.name}|{lead.address}"
                    if not lead.name or key in seen_urls:
                        continue
                    if not _is_within_radius(lead, radius):
                        continue

                    seen_urls.add(key)
                    leads.append(lead)

                    if on_lead is not None:
                        should_stop = on_lead(lead)
                        if should_stop:
                            break

                    if len(leads) >= max_results:
                        break
                except PlaywrightTimeoutError:
                    continue
                time.sleep(delay_seconds)
        finally:
            browser.close()

    return leads


def build_maps_search_url(
    query: str,
    lat: float | None = None,
    lng: float | None = None,
    radius: float | None = None,
) -> str:
    search = query.strip()
    if lat is not None and lng is not None and radius is not None:
        return f"{MAPS_SEARCH_BASE_URL}/{quote_plus(search)}/@{lat},{lng},{_radius_to_zoom(radius)}z"
    return f"{MAPS_SEARCH_BASE_URL}/{quote_plus(search)}"


def distance_meters(
    origin_lat: float,
    origin_lng: float,
    destination_lat: float,
    destination_lng: float,
) -> int:
    R = 6_371_000
    lat1, lat2 = radians(origin_lat), radians(destination_lat)
    dlat = radians(destination_lat - origin_lat)
    dlng = radians(destination_lng - origin_lng)
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlng / 2) ** 2
    return round(R * 2 * asin(sqrt(a)))


def _collect_place_links(page, *, max_results: int, scrolls: int, delay_seconds: float) -> list[str]:
    links: list[str] = []
    seen: set[str] = set()
    feed = page.locator('div[role="feed"]').first

    for _ in range(scrolls):
        for href in _visible_place_hrefs(page):
            clean = href.split("&")[0]
            if clean not in seen:
                seen.add(clean)
                links.append(clean)
            if len(links) >= max_results:
                return links

        if feed.count():
            feed.evaluate("(node) => node.scrollBy(0, node.scrollHeight)")
        else:
            page.mouse.wheel(0, 2000)
        time.sleep(delay_seconds)

    return links


def _visible_place_hrefs(page) -> Iterable[str]:
    anchors = page.locator('a[href*="/maps/place/"]')
    for i in range(anchors.count()):
        href = anchors.nth(i).get_attribute("href")
        if href:
            yield href


def _extract_place(page) -> LeadData:
    name = _text(page, "h1")
    address = _text(page, 'button[data-item-id="address"], [data-item-id="address"]')
    phone = _text(page, 'button[data-item-id^="phone"], [data-item-id^="phone"]')
    website = _attr(page, 'a[data-item-id="authority"], a[aria-label^="Website:"]', "href")
    rating, review_count = _extract_rating(page)
    lat, lng = _extract_lat_lng_from_url(page.url)

    return LeadData(
        place_id="",
        name=name,
        address=_clean_labeled_text(address, "Address:"),
        phone=_clean_labeled_text(phone, "Phone:"),
        website=website,
        google_maps_url=page.url,
        rating=rating,
        review_count=review_count,
        latitude=lat,
        longitude=lng,
    )


def _with_distance(lead: LeadData, origin_lat: float | None, origin_lng: float | None) -> LeadData:
    if origin_lat is None or origin_lng is None or lead.latitude is None or lead.longitude is None:
        return lead
    return replace(lead, distance_meters=distance_meters(origin_lat, origin_lng, lead.latitude, lead.longitude))


def _is_within_radius(lead: LeadData, radius: float | None) -> bool:
    if radius is None or lead.distance_meters is None:
        return True
    return lead.distance_meters <= radius


def _candidate_limit(max_results: int, radius: float | None) -> int:
    if radius is None:
        return max_results
    return max(max_results * 3, max_results + 20)


def _extract_rating(page) -> tuple[float | None, int | None]:
    rating_text = _text(page, 'div.F7nice span[aria-hidden="true"], span[role="img"][aria-label*="stars"]')
    rating = _first_float(rating_text)
    review_text = _text(page, 'button[jsaction*="pane.rating.moreReviews"], span[aria-label*="reviews"]')
    review_count = _first_int(review_text)
    return rating, review_count


def _extract_lat_lng_from_url(url: str) -> tuple[float | None, float | None]:
    m = re.search(r"@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),", url)
    if not m:
        m = re.search(r"!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)", url)
    if not m:
        return None, None
    return float(m.group(1)), float(m.group(2))


def _wait_for_results_or_place(page) -> None:
    page.locator('div[role="feed"], h1').first.wait_for()


def _wait_for_place_panel(page) -> None:
    page.locator("h1").first.wait_for()


def _accept_consent_if_present(page) -> None:
    for selector in ['button:has-text("Accept all")', 'button:has-text("I agree")', 'button:has-text("Accept")']:
        btn = page.locator(selector).first
        if btn.count():
            try:
                btn.click(timeout=1500)
                return
            except Exception:
                pass


def _text(page, selector: str) -> str:
    loc = page.locator(selector).first
    if not loc.count():
        return ""
    try:
        return " ".join(loc.inner_text(timeout=1500).split())
    except Exception:
        return ""


def _attr(page, selector: str, name: str) -> str:
    loc = page.locator(selector).first
    if not loc.count():
        return ""
    try:
        return loc.get_attribute(name, timeout=1500) or ""
    except Exception:
        return ""


def _clean_labeled_text(value: str, label: str) -> str:
    value = re.sub(r"[-]", "", value).strip()
    if value.startswith(label):
        return value[len(label):].strip()
    return value


def _first_float(value: str) -> float | None:
    m = re.search(r"\d+(?:\.\d+)?", value.replace(",", "."))
    return float(m.group(0)) if m else None


def _first_int(value: str) -> int | None:
    m = re.search(r"[\d,.\s]+", value)
    if not m:
        return None
    digits = re.sub(r"\D", "", m.group(0))
    return int(digits) if digits else None


def _radius_to_zoom(radius: float) -> int:
    thresholds = [(1000, 15), (3000, 14), (7000, 13), (15000, 12), (30000, 11)]
    for limit, zoom in thresholds:
        if radius <= limit:
            return zoom
    return 10


def _looks_like_place_page(url: str) -> bool:
    return "/maps/place/" in url
