"""
FleetPride.com Product Scraper

A robust scraper for extracting product information from FleetPride.com
with category filtering, Selenium support for JavaScript rendering,
and rate limiting.

Usage:
    python fleetpride_scraper.py --categories "Brakes,Filters" --output products.json
"""

import json
import time
import re
import argparse
import logging
import csv
from urllib.parse import urljoin
from dataclasses import dataclass, asdict
from typing import Optional
from pathlib import Path
from datetime import datetime
from contextlib import contextmanager

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class Product:
    """Represents a product with all scraped information."""
    name: str
    part_number: str
    sku: Optional[str]
    brand: Optional[str]
    category: str
    subcategory: Optional[str]
    price: Optional[str]
    description: Optional[str]
    features: list  # Product features/benefits list
    specifications: dict  # Technical specifications
    url: str
    image_url: Optional[str]
    scraped_at: str


class SeleniumDriver:
    """Manages Selenium WebDriver lifecycle and operations."""

    def __init__(self, headless: bool = True, page_load_timeout: int = 30):
        """
        Initialize Selenium driver manager.

        Args:
            headless: Run browser in headless mode.
            page_load_timeout: Page load timeout in seconds.
        """
        self.headless = headless
        self.page_load_timeout = page_load_timeout
        self.driver: webdriver.Chrome | None = None

    def _create_options(self) -> ChromeOptions:
        """Create Chrome options with anti-detection measures."""
        options = ChromeOptions()

        if self.headless:
            options.add_argument('--headless=new')

        # Anti-detection measures
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option('excludeSwitches', ['enable-automation'])
        options.add_experimental_option('useAutomationExtension', False)

        # Performance and stability
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--window-size=1920,1080')
        options.add_argument('--start-maximized')

        # Realistic user agent
        options.add_argument(
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )

        # Additional settings
        options.add_argument('--disable-notifications')
        options.add_argument('--disable-popup-blocking')
        options.add_argument('--lang=en-US')

        # Disable images for faster loading (optional)
        # prefs = {"profile.managed_default_content_settings.images": 2}
        # options.add_experimental_option("prefs", prefs)

        return options

    def start(self):
        """Start the WebDriver."""
        if self.driver:
            return

        logger.info("Starting Chrome WebDriver...")
        options = self._create_options()

        try:
            service = ChromeService(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=options)
            self.driver.set_page_load_timeout(self.page_load_timeout)

            # Execute anti-detection script
            self.driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
                'source': '''
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => undefined
                    });
                    Object.defineProperty(navigator, 'plugins', {
                        get: () => [1, 2, 3, 4, 5]
                    });
                    Object.defineProperty(navigator, 'languages', {
                        get: () => ['en-US', 'en']
                    });
                '''
            })

            logger.info("WebDriver started successfully")

        except WebDriverException as e:
            logger.error(f"Failed to start WebDriver: {e}")
            raise

    def stop(self):
        """Stop the WebDriver."""
        if self.driver:
            logger.info("Stopping WebDriver...")
            try:
                self.driver.quit()
            except Exception as e:
                logger.warning(f"Error stopping driver: {e}")
            finally:
                self.driver = None

    def get_page(self, url: str, wait_for_selector: str | None = None,
                 wait_timeout: int = 10) -> str | None:
        """
        Navigate to URL and get page source.

        Args:
            url: URL to navigate to.
            wait_for_selector: CSS selector to wait for before returning.
            wait_timeout: Timeout for waiting for selector.

        Returns:
            Page source HTML or None if failed.
        """
        if not self.driver:
            self.start()

        try:
            logger.debug(f"Navigating to: {url}")
            self.driver.get(url)

            # Wait for page to be ready
            WebDriverWait(self.driver, wait_timeout).until(
                lambda d: d.execute_script('return document.readyState') == 'complete'
            )

            # Additional wait for dynamic content
            if wait_for_selector:
                try:
                    WebDriverWait(self.driver, wait_timeout).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, wait_for_selector))
                    )
                except TimeoutException:
                    logger.warning(f"Timeout waiting for selector: {wait_for_selector}")

            # Extra delay for JavaScript execution
            time.sleep(1)

            return self.driver.page_source

        except TimeoutException:
            logger.error(f"Timeout loading page: {url}")
            return None
        except WebDriverException as e:
            logger.error(f"WebDriver error for {url}: {e}")
            return None

    def scroll_page(self, scroll_pause: float = 0.5, max_scrolls: int = 10):
        """
        Scroll down the page to load lazy content.

        Args:
            scroll_pause: Pause between scrolls in seconds.
            max_scrolls: Maximum number of scroll actions.
        """
        if not self.driver:
            return

        last_height = self.driver.execute_script("return document.body.scrollHeight")

        for _ in range(max_scrolls):
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(scroll_pause)

            new_height = self.driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height

    def click_element(self, selector: str, timeout: int = 5) -> bool:
        """
        Click an element by CSS selector.

        Args:
            selector: CSS selector for element.
            timeout: Wait timeout.

        Returns:
            True if clicked successfully.
        """
        if not self.driver:
            return False

        try:
            element = WebDriverWait(self.driver, timeout).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
            )
            element.click()
            return True
        except (TimeoutException, WebDriverException) as e:
            logger.debug(f"Could not click {selector}: {e}")
            return False

    @contextmanager
    def managed_session(self):
        """Context manager for driver lifecycle."""
        try:
            self.start()
            yield self
        finally:
            self.stop()


class FleetPrideScraper:
    """
    Scraper for FleetPride.com product catalog.

    Uses Selenium for JavaScript rendering and supports category filtering.
    """

    BASE_URL = "https://www.fleetpride.com"
    PARTS_URL = "https://parts.fleetpride.com"

    # Known category slugs - update as needed based on site exploration
    KNOWN_CATEGORIES = {
        "brakes": "/parts/brakes-wheel-end",
        "filters": "/parts/lubrication-filtration",
        "lighting": "/parts/lighting",
        "electrical": "/parts/starters-alternators-electrical",
        "exhaust": "/parts/exhaust",
        "cooling": "/parts/cooling-system",
        "suspension": "/parts/suspension-steering",
        "engine": "/parts/engine",
        "drivetrain": "/parts/drive-train",
        "trailer": "/parts/trailer",
        "hvac": "/parts/air-conditioning-heating",
        "air-system": "/parts/air-system",
        "fuel": "/parts/fuel-systems",
        "body": "/parts/body",
        "cab": "/parts/cab-chrome",
        "tools": "/parts/tools-safety-supplies",
    }

    def __init__(
        self,
        categories: list[str] | None = None,
        delay: float = 2.0,
        max_products_per_category: int | None = None,
        output_file: str = "fleetpride_products.json",
        headless: bool = True
    ):
        """
        Initialize the scraper.

        Args:
            categories: List of category names to scrape. If None, scrapes all.
            delay: Delay between requests in seconds.
            max_products_per_category: Limit products per category (for testing).
            output_file: Output JSON file path.
            headless: Run browser in headless mode.
        """
        self.categories = categories
        self.delay = delay
        self.max_products_per_category = max_products_per_category
        self.output_file = output_file
        self.headless = headless
        self.driver_manager = SeleniumDriver(headless=headless)
        self.products: list[Product] = []
        self.visited_urls: set[str] = set()
        self.errors: list[dict] = []

    def _rate_limit(self):
        """Apply rate limiting between requests."""
        time.sleep(self.delay)

    def _fetch_page(self, url: str, wait_for: str | None = None) -> BeautifulSoup | None:
        """
        Fetch a page and return parsed BeautifulSoup object.

        Args:
            url: URL to fetch.
            wait_for: CSS selector to wait for.

        Returns:
            BeautifulSoup object or None if fetch failed.
        """
        if url in self.visited_urls:
            logger.debug(f"Skipping already visited: {url}")
            return None

        self.visited_urls.add(url)
        self._rate_limit()

        html = self.driver_manager.get_page(url, wait_for_selector=wait_for)
        if not html:
            self.errors.append({"url": url, "error": "Failed to load page"})
            return None

        return BeautifulSoup(html, 'html.parser')

    def _fetch_page_with_scroll(self, url: str, wait_for: str | None = None, save_debug: bool = False) -> BeautifulSoup | None:
        """
        Fetch a page with scrolling to load lazy content.

        Args:
            url: URL to fetch.
            wait_for: CSS selector to wait for.
            save_debug: Save HTML to debug file.

        Returns:
            BeautifulSoup object or None if fetch failed.
        """
        if url in self.visited_urls:
            logger.debug(f"Skipping already visited: {url}")
            return None

        self.visited_urls.add(url)
        self._rate_limit()

        html = self.driver_manager.get_page(url, wait_for_selector=wait_for)
        if not html:
            self.errors.append({"url": url, "error": "Failed to load page"})
            return None

        # Scroll to load lazy content
        self.driver_manager.scroll_page(scroll_pause=0.5, max_scrolls=5)

        # Get updated page source after scrolling
        html = self.driver_manager.driver.page_source

        # Save debug HTML if requested
        if save_debug:
            debug_file = f"debug_page_{url.replace('https://', '').replace('/', '_')[:50]}.html"
            with open(debug_file, 'w', encoding='utf-8') as f:
                f.write(html)
            logger.info(f"Saved debug HTML to {debug_file}")

        return BeautifulSoup(html, 'html.parser')

    def discover_categories(self) -> dict[str, str]:
        """
        Discover available categories from the main parts page.

        Returns:
            Dictionary mapping category names to URLs.
        """
        logger.info("Discovering categories...")
        categories = {}

        soup = self._fetch_page(f"{self.BASE_URL}/parts")
        if not soup:
            logger.warning("Could not fetch main parts page, using known categories")
            return self.KNOWN_CATEGORIES

        # Look for category links in navigation or category sections
        category_selectors = [
            'nav a[href*="/parts/"]',
            '.category-list a',
            '.categories a',
            'a[href*="/category/"]',
            '.nav-categories a',
            '[data-category] a',
            '.mega-menu a[href*="/parts/"]',
            '.dropdown-menu a[href*="/parts/"]',
            'aside a[href*="/parts/"]',
            '.sidebar a[href*="/parts/"]',
        ]

        for selector in category_selectors:
            links = soup.select(selector)
            for link in links:
                href = link.get('href', '')
                name = link.get_text(strip=True)
                if href and name and '/parts/' in href:
                    full_url = urljoin(self.BASE_URL, href)
                    slug = name.lower().replace(' ', '-').replace('&', 'and')
                    categories[slug] = full_url

        if not categories:
            logger.warning("No categories discovered, using known categories")
            return self.KNOWN_CATEGORIES

        logger.info(f"Discovered {len(categories)} categories")
        return categories

    def _get_filtered_categories(self, all_categories: dict[str, str]) -> dict[str, str]:
        """
        Filter categories based on user selection.

        Args:
            all_categories: All available categories.

        Returns:
            Filtered dictionary of categories.
        """
        if not self.categories:
            return all_categories

        filtered = {}
        for cat in self.categories:
            cat_lower = cat.lower().replace(' ', '-')
            if cat_lower in all_categories:
                filtered[cat_lower] = all_categories[cat_lower]
            else:
                # Try partial matching
                for key, url in all_categories.items():
                    if cat_lower in key or key in cat_lower:
                        filtered[key] = url
                        break
                else:
                    logger.warning(f"Category '{cat}' not found. Available: {list(all_categories.keys())}")

        return filtered

    def _extract_product_from_listing(self, product_elem, category: str) -> dict | None:
        """
        Extract basic product info from a listing page element.

        Args:
            product_elem: BeautifulSoup element containing product info.
            category: Category name for this product.

        Returns:
            Dictionary with product URL and basic info, or None.
        """
        # FleetPride-specific selectors first, then generic ones
        link_selectors = [
            'a.link-title',  # FleetPride uses this
            '.link-title a',
            'a[href*="/parts/"]',  # FleetPride product URLs
            'a.product-link',
            'a[href*="/product/"]',
            'a[href*="/p/"]',
            'a[href*="/PD/"]',
            '.product-title a',
            '.product-name a',
            'h2 a', 'h3 a', 'h4 a',
        ]

        link = None
        for selector in link_selectors:
            link = product_elem.select_one(selector)
            if link:
                break

        if not link:
            link = product_elem.find('a', href=True)

        if not link:
            return None

        href = link.get('href', '')
        if not href:
            return None

        # Skip non-product links (categories, etc.)
        # FleetPride products have format: /parts/brand-product-name-partnumber
        if '/parts/' in href:
            # Check it's a product (has more path segments) not a category
            path_parts = href.strip('/').split('/')
            if len(path_parts) < 2:
                return None

        # Extract part number if visible in listing
        part_num = None
        part_selectors = [
            '.part-number', '.sku', '[data-part-number]',
            '.product-sku', '.item-number', '.product-id',
            '[data-sku]', '[data-product-id]', '.sub-text',
        ]
        for selector in part_selectors:
            elem = product_elem.select_one(selector)
            if elem:
                part_num = elem.get_text(strip=True)
                if not part_num:
                    part_num = elem.get('data-part-number') or elem.get('data-sku')
                break

        # Also check data attributes on container
        if not part_num:
            part_num = (
                product_elem.get('data-part-number') or
                product_elem.get('data-sku') or
                product_elem.get('data-product-id')
            )

        return {
            'url': urljoin(self.BASE_URL, href),
            'part_number_preview': part_num,
            'category': category,
        }

    def _extract_part_number(self, soup: BeautifulSoup) -> str:
        """
        Extract part number from product page.

        Args:
            soup: BeautifulSoup object of product page.

        Returns:
            Part number string.
        """
        # FleetPride-specific: Look for "Part #: XXX" pattern in page text
        text_content = soup.get_text()

        # FleetPride format: "Part #: HDV1601B|Brand: HDVALUE|MPN #: HDV1601B"
        fleetpride_pattern = r'Part\s*#:\s*([A-Z0-9\-]+)'
        match = re.search(fleetpride_pattern, text_content, re.I)
        if match:
            return match.group(1).strip()

        # Various selectors for part numbers
        selectors = [
            '.part-number', '.product-part-number', '#part-number',
            '[data-part-number]', '.sku', '.product-sku',
            '[itemprop="sku"]', '[itemprop="productID"]',
            '.item-number', '.product-id', '.mpn',
            '[data-sku]', '[data-product-id]', '[data-mpn]',
        ]

        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                text = elem.get_text(strip=True)
                # Clean up common prefixes
                text = re.sub(r'^(Part\s*#?:?\s*|SKU:?\s*|Item\s*#?:?\s*|MPN:?\s*)', '', text, flags=re.I)
                if text and len(text) < 50:  # Part numbers shouldn't be too long
                    return text.strip()
                # Check data attributes
                attr_val = elem.get('data-part-number') or elem.get('data-sku') or elem.get('content')
                if attr_val:
                    return attr_val.strip()

        # Check data attributes on product container
        product_container = soup.select_one('[data-part-number], [data-sku], [data-product-id]')
        if product_container:
            return (
                product_container.get('data-part-number') or
                product_container.get('data-sku') or
                product_container.get('data-product-id') or
                ''
            )

        # Search in JSON-LD structured data
        scripts = soup.select('script[type="application/ld+json"]')
        for script in scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, dict):
                    if data.get('@type') == 'Product':
                        return data.get('sku') or data.get('mpn') or data.get('productID') or ''
                    if 'sku' in data:
                        return data['sku']
            except (json.JSONDecodeError, TypeError):
                continue

        # Generic patterns
        patterns = [
            r'Part\s*(?:Number|#|No\.?)[\s:]+([A-Z0-9\-]+)',
            r'SKU[\s:]+([A-Z0-9\-]+)',
            r'Item\s*(?:Number|#|No\.?)[\s:]+([A-Z0-9\-]+)',
            r'MPN[\s:]+([A-Z0-9\-]+)',
        ]

        for pattern in patterns:
            match = re.search(pattern, text_content, re.I)
            if match:
                return match.group(1).strip()

        return "UNKNOWN"

    def _extract_sku(self, soup: BeautifulSoup) -> str | None:
        """Extract SKU/MPN if different from part number."""
        # FleetPride-specific: Look for MPN pattern
        text_content = soup.get_text()
        mpn_pattern = r'MPN\s*#?:\s*([A-Z0-9\-]+)'
        match = re.search(mpn_pattern, text_content, re.I)
        if match:
            return match.group(1).strip()

        selectors = [
            '.sku:not(.part-number)', '[data-sku]',
            '[itemprop="sku"]', '.manufacturer-sku',
        ]

        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                text = elem.get_text(strip=True) or elem.get('data-sku', '') or elem.get('content', '')
                text = re.sub(r'^SKU:?\s*', '', text, flags=re.I)
                if text and len(text) < 50:
                    return text.strip()

        # Check JSON-LD
        scripts = soup.select('script[type="application/ld+json"]')
        for script in scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, dict) and data.get('@type') == 'Product':
                    return data.get('sku')
            except (json.JSONDecodeError, TypeError):
                continue

        return None

    def _extract_brand(self, soup: BeautifulSoup) -> str | None:
        """Extract brand/manufacturer name."""
        # FleetPride-specific: Look for Brand pattern
        text_content = soup.get_text()
        brand_pattern = r'Brand:\s*([A-Za-z0-9\s]+?)(?:\||$|\n)'
        match = re.search(brand_pattern, text_content)
        if match:
            return match.group(1).strip()

        selectors = [
            '.brand', '.manufacturer', '[itemprop="brand"]',
            '.product-brand', '[data-brand]', '.brand-name',
            '.vendor', '.product-vendor',
        ]

        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                # Check for nested name element
                name_elem = elem.select_one('[itemprop="name"]')
                if name_elem:
                    return name_elem.get_text(strip=True)
                text = elem.get_text(strip=True)
                if text:
                    return text

        # Check JSON-LD
        scripts = soup.select('script[type="application/ld+json"]')
        for script in scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, dict) and data.get('@type') == 'Product':
                    brand = data.get('brand')
                    if isinstance(brand, dict):
                        return brand.get('name')
                    return brand
            except (json.JSONDecodeError, TypeError):
                continue

        return None

    def _extract_price(self, soup: BeautifulSoup) -> str | None:
        """Extract product price."""
        # FleetPride-specific: Look for price with $ in the page
        text_content = soup.get_text()

        # Look for price patterns like "$95.00" or "$129.99"
        price_patterns = [
            r'\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',  # $95.00, $1,234.56
            r'Your Price[:\s]*\$(\d+\.?\d*)',
        ]

        for pattern in price_patterns:
            match = re.search(pattern, text_content)
            if match:
                price_val = match.group(1) if match.lastindex else match.group(0)
                if not price_val.startswith('$'):
                    return f"${price_val}"
                return price_val

        # FleetPride also uses .your-price class
        selectors = [
            '.your-price', '.price', '.product-price', '[itemprop="price"]',
            '.current-price', '.sale-price', '[data-price]',
            '.regular-price', '.special-price', '.offer-price',
        ]

        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                # Check content attribute first
                content = elem.get('content')
                if content:
                    try:
                        return f"${float(content):.2f}"
                    except ValueError:
                        pass

                text = elem.get_text(strip=True)
                price_match = re.search(r'\$[\d,]+\.?\d*', text)
                if price_match:
                    return price_match.group()

        # Check JSON-LD
        scripts = soup.select('script[type="application/ld+json"]')
        for script in scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, dict) and data.get('@type') == 'Product':
                    offers = data.get('offers', {})
                    if isinstance(offers, dict):
                        price = offers.get('price')
                        if price:
                            return f"${float(price):.2f}"
            except (json.JSONDecodeError, TypeError, ValueError):
                continue

        return None

    def _extract_description(self, soup: BeautifulSoup) -> str | None:
        """Extract product description."""
        selectors = [
            '.product-description', '[itemprop="description"]',
            '.description', '#product-description',
            '.product-details', '.product-info',
            '.product-summary', '.product-content',
        ]

        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                text = elem.get_text(strip=True)
                if text and len(text) > 10:
                    return text[:2000]

        # Check JSON-LD
        scripts = soup.select('script[type="application/ld+json"]')
        for script in scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, dict) and data.get('@type') == 'Product':
                    desc = data.get('description')
                    if desc:
                        return desc[:2000]
            except (json.JSONDecodeError, TypeError):
                continue

        return None

    def _extract_specifications(self, soup: BeautifulSoup) -> dict:
        """Extract product specifications as key-value pairs."""
        specs = {}

        # FleetPride-specific: specItem with specLabel and specValue
        spec_items = soup.select('.specItem')
        for item in spec_items:
            label_elem = item.select_one('.specLabel')
            value_elem = item.select_one('.specValue')
            if label_elem and value_elem:
                # Clean up label (remove trailing colon)
                label = label_elem.get_text(strip=True).rstrip(':')
                value = value_elem.get_text(strip=True)
                if label and value:
                    specs[label] = value

        # If FleetPride-specific didn't find anything, try generic patterns
        if not specs:
            # Look for specification tables
            spec_tables = soup.select(
                '.specifications table, .product-specs table, .spec-table, '
                '.product-attributes table, .tech-specs table, #specifications table, '
                '.specsWrapper table'
            )
            for table in spec_tables:
                rows = table.select('tr')
                for row in rows:
                    cells = row.select('td, th')
                    if len(cells) >= 2:
                        key = cells[0].get_text(strip=True).rstrip(':')
                        value = cells[1].get_text(strip=True)
                        if key and value:
                            specs[key] = value

            # Look for definition lists
            dl_elems = soup.select('.specifications dl, .product-specs dl, .attributes dl')
            for dl in dl_elems:
                dts = dl.select('dt')
                dds = dl.select('dd')
                for dt, dd in zip(dts, dds):
                    key = dt.get_text(strip=True).rstrip(':')
                    value = dd.get_text(strip=True)
                    if key and value:
                        specs[key] = value

            # Look for key-value spans/divs
            generic_spec_items = soup.select(
                '.spec-item, .attribute, .product-attribute, '
                '.spec-row, .attribute-row'
            )
            for item in generic_spec_items:
                label = item.select_one('.label, .name, .key, .spec-name, .attr-name')
                value = item.select_one('.value, .spec-value, .attr-value')
                if label and value:
                    specs[label.get_text(strip=True).rstrip(':')] = value.get_text(strip=True)

        return specs

    def _extract_features(self, soup: BeautifulSoup) -> list:
        """Extract product features/benefits as a list."""
        features = []

        # FleetPride-specific: Look for feature/benefit lists
        # Try various selectors for feature lists
        feature_selectors = [
            '.product-features li',
            '.features-list li',
            '.benefits-list li',
            '.feature-list li',
            '[class*="feature"] li',
            '[class*="benefit"] li',
            '.product-highlights li',
            '.key-features li',
        ]

        for selector in feature_selectors:
            items = soup.select(selector)
            for item in items:
                text = item.get_text(strip=True)
                if text and len(text) > 3 and text not in features:
                    features.append(text)

        # Look for bullet points in description areas
        desc_areas = soup.select('.product-description ul li, .description ul li')
        for item in desc_areas:
            text = item.get_text(strip=True)
            if text and len(text) > 3 and text not in features:
                features.append(text)

        # Look for rich text content that might contain features
        rich_text = soup.select('.slds-rich-text-editor__output ul li')
        for item in rich_text:
            text = item.get_text(strip=True)
            if text and len(text) > 3 and len(text) < 200 and text not in features:
                features.append(text)

        # Extract from JSON-LD if available
        scripts = soup.select('script[type="application/ld+json"]')
        for script in scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, dict) and data.get('@type') == 'Product':
                    # Check for additionalProperty which may contain features
                    props = data.get('additionalProperty', [])
                    if isinstance(props, list):
                        for prop in props:
                            if isinstance(prop, dict):
                                name = prop.get('name', '')
                                value = prop.get('value', '')
                                if name and value:
                                    features.append(f"{name}: {value}")
            except (json.JSONDecodeError, TypeError):
                continue

        return features

    def _extract_image(self, soup: BeautifulSoup) -> str | None:
        """Extract main product image URL."""
        selectors = [
            '.product-image img', '#product-image img',
            '[itemprop="image"]', '.main-image img',
            '.gallery-main img', 'img.product-img',
            '.product-gallery img', '.product-photo img',
        ]

        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                src = (
                    elem.get('src') or
                    elem.get('data-src') or
                    elem.get('data-lazy-src') or
                    elem.get('data-zoom-image')
                )
                if src and not src.startswith('data:'):
                    return urljoin(self.BASE_URL, src)

        # Check JSON-LD
        scripts = soup.select('script[type="application/ld+json"]')
        for script in scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, dict) and data.get('@type') == 'Product':
                    image = data.get('image')
                    if isinstance(image, list) and image:
                        return image[0]
                    if isinstance(image, str):
                        return image
            except (json.JSONDecodeError, TypeError):
                continue

        return None

    def _extract_name(self, soup: BeautifulSoup) -> str:
        """Extract product name."""
        selectors = [
            'h1.product-name', 'h1.product-title', 'h1[itemprop="name"]',
            '[itemprop="name"]', '.product-name', '.product-title',
            'h1',
        ]

        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                text = elem.get_text(strip=True)
                if text and len(text) > 2:
                    return text

        # Check JSON-LD
        scripts = soup.select('script[type="application/ld+json"]')
        for script in scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, dict) and data.get('@type') == 'Product':
                    name = data.get('name')
                    if name:
                        return name
            except (json.JSONDecodeError, TypeError):
                continue

        return "Unknown Product"

    def scrape_product_page(self, url: str, category: str, subcategory: str | None = None) -> Product | None:
        """
        Scrape a single product page.

        Args:
            url: Product page URL.
            category: Category name.
            subcategory: Optional subcategory name.

        Returns:
            Product object or None if scraping failed.
        """
        logger.debug(f"Scraping product: {url}")

        soup = self._fetch_page(url, wait_for='.product-name, .product-title, h1, [itemprop="name"]')
        if not soup:
            return None

        try:
            product = Product(
                name=self._extract_name(soup),
                part_number=self._extract_part_number(soup),
                sku=self._extract_sku(soup),
                brand=self._extract_brand(soup),
                category=category,
                subcategory=subcategory,
                price=self._extract_price(soup),
                description=self._extract_description(soup),
                features=self._extract_features(soup),
                specifications=self._extract_specifications(soup),
                url=url,
                image_url=self._extract_image(soup),
                scraped_at=datetime.now().isoformat(),
            )

            logger.info(f"Scraped: {product.part_number} - {product.name[:50]}")
            return product

        except Exception as e:
            logger.error(f"Error parsing product {url}: {e}")
            self.errors.append({"url": url, "error": str(e)})
            return None

    def scrape_category_page(self, url: str, category: str, soup: BeautifulSoup | None = None) -> list[dict]:
        """
        Scrape a category listing page to get product URLs.

        Args:
            url: Category page URL.
            category: Category name.
            soup: Optional pre-fetched BeautifulSoup object.

        Returns:
            List of product info dictionaries.
        """
        logger.info(f"Scraping category page: {url}")
        products = []

        if soup is None:
            soup = self._fetch_page_with_scroll(url, wait_for='.product-item, .product-card, .product')
        if not soup:
            return products

        # Find product containers - FleetPride uses Salesforce LWC components
        product_selectors = [
            '.plp-card',  # FleetPride product listing cards
            '[class*="plp-card"]',
            '.slds-card',  # Salesforce Lightning Design System cards
            '.product-item', '.product-card', '.product-tile',
            '[data-product]', '.product', '.item',
            '.search-result-item', '.catalog-item',
            '.product-grid-item', '.plp-product',
        ]

        product_elements = []
        for selector in product_selectors:
            product_elements = soup.select(selector)
            if product_elements:
                logger.debug(f"Found products with selector: {selector}")
                break

        # If no containers found, try extracting products directly from links
        if not product_elements:
            logger.debug("No product containers found, extracting from links directly")
            # Find all product links on the page
            all_links = soup.select('a[href*="/parts/"]')
            seen_urls = set()
            for link in all_links:
                href = link.get('href', '')
                # Skip category pages (they have fewer path segments)
                path_parts = href.strip('/').split('/')
                if len(path_parts) >= 2 and href not in seen_urls:
                    # Get the parent container for context
                    parent = link.find_parent(['div', 'article', 'li', 'section'])
                    if parent:
                        product_elements.append(parent)
                        seen_urls.add(href)
            logger.debug(f"Found {len(product_elements)} products from direct link extraction")

        for elem in product_elements:
            product_info = self._extract_product_from_listing(elem, category)
            if product_info:
                products.append(product_info)

        logger.info(f"Found {len(products)} products on page")
        return products

    def get_pagination_urls(self, soup: BeautifulSoup, base_url: str) -> list[str]:
        """
        Extract pagination URLs from a listing page.

        Args:
            soup: BeautifulSoup object of listing page.
            base_url: Base URL for relative link resolution.

        Returns:
            List of pagination URLs.
        """
        urls = []

        # FleetPride-specific pagination selectors
        pagination_selectors = [
            # FleetPride/Salesforce LWC pagination
            '.pagination a', '.slds-pagination a', '.pagination-list a',
            '[class*="pagination"] a', '[class*="pager"] a',
            # Next page links
            'a[rel="next"]', '.next-page a', '.next a',
            'a[aria-label*="next"]', 'a[aria-label*="Next"]',
            'a[title*="next"]', 'a[title*="Next"]',
            # Generic pagination
            '.pager a', '.page-numbers a', 'nav.pagination a',
            '[aria-label="pagination"] a', '.page-link',
            '.paginator a', '.paging a',
            # Numbered page links
            'a.page-number', 'a[data-page]', '.page-item a',
        ]

        for selector in pagination_selectors:
            links = soup.select(selector)
            for link in links:
                href = link.get('href')
                if href and href not in ['#', 'javascript:void(0)', 'javascript:;']:
                    full_url = urljoin(base_url, href)
                    if full_url not in urls and full_url not in self.visited_urls:
                        urls.append(full_url)

        return urls

    def get_total_pages(self, soup: BeautifulSoup) -> int:
        """
        Try to determine total number of pages from pagination.

        Args:
            soup: BeautifulSoup object of listing page.

        Returns:
            Total number of pages, or 1 if can't determine.
        """
        # Look for page count text like "Page 1 of 10" or "1 - 10 of 100"
        text_content = soup.get_text()

        patterns = [
            r'Page\s+\d+\s+of\s+(\d+)',
            r'of\s+(\d+)\s+pages?',
            r'(\d+)\s+total\s+pages?',
        ]

        for pattern in patterns:
            match = re.search(pattern, text_content, re.I)
            if match:
                return int(match.group(1))

        # Look for highest page number in pagination links
        page_nums = []
        page_links = soup.select('[data-page], .page-number, .pagination a, [class*="page"] a')
        for link in page_links:
            # Check data-page attribute
            page_attr = link.get('data-page')
            if page_attr and page_attr.isdigit():
                page_nums.append(int(page_attr))

            # Check link text for numbers
            text = link.get_text(strip=True)
            if text.isdigit():
                page_nums.append(int(text))

        if page_nums:
            return max(page_nums)

        return 1

    def click_next_page(self) -> bool:
        """
        Click the next page button for AJAX-based pagination.
        Handles Shadow DOM elements used by Salesforce LWC.

        Returns:
            True if next page was clicked successfully.
        """
        if not self.driver_manager.driver:
            return False

        # First, scroll to bottom of page to ensure pagination is visible
        try:
            self.driver_manager.driver.execute_script(
                "window.scrollTo(0, document.body.scrollHeight);"
            )
            time.sleep(1)  # Wait for any lazy-loaded content
        except Exception as e:
            logger.debug(f"Could not scroll to bottom: {e}")

        # Try using JavaScript to find and click the Next Page button
        # This works with Shadow DOM elements
        js_click_next = """
        // Function to find element in shadow DOM
        function querySelectorAllDeep(selector, root = document) {
            const elements = [];
            const traverse = (node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.matches && node.matches(selector)) {
                        elements.push(node);
                    }
                    if (node.shadowRoot) {
                        traverse(node.shadowRoot);
                    }
                }
                node.childNodes.forEach(child => traverse(child));
            };
            traverse(root);
            return elements;
        }

        // Try to find Next Page button
        const selectors = [
            '[aria-label="Next Page"]',
            '[title="Next Page"]',
            'button[aria-label="Next Page"]',
            'button[title="Next Page"]'
        ];

        for (const selector of selectors) {
            // First try regular querySelector
            let btn = document.querySelector(selector);
            if (!btn) {
                // Try deep shadow DOM search
                const found = querySelectorAllDeep(selector);
                if (found.length > 0) {
                    btn = found[0];
                }
            }
            if (btn && !btn.disabled && btn.offsetParent !== null) {
                btn.scrollIntoView({behavior: 'smooth', block: 'center'});
                btn.click();
                return true;
            }
        }
        return false;
        """

        try:
            result = self.driver_manager.driver.execute_script(js_click_next)
            if result:
                logger.info("Clicked next page button via JavaScript")
                time.sleep(2)  # Wait for page to load
                return True
        except Exception as e:
            logger.debug(f"JavaScript click failed: {e}")

        # Fallback to regular Selenium selectors
        next_selectors = [
            'button[aria-label="Next Page"]',
            'button[title="Next Page"]',
            '[aria-label="Next Page"]',
            '[title="Next Page"]',
            '.slds-pagination_container button[aria-label="Next Page"]',
            'button[aria-label*="Next"]',
            'a[aria-label*="Next"]',
            '.next-page', '.pagination-next',
        ]

        for selector in next_selectors:
            try:
                elements = self.driver_manager.driver.find_elements(By.CSS_SELECTOR, selector)
                logger.debug(f"Found {len(elements)} elements for selector: {selector}")
                for elem in elements:
                    try:
                        if elem.is_displayed() and elem.is_enabled():
                            classes = elem.get_attribute('class') or ''
                            aria_disabled = elem.get_attribute('aria-disabled')
                            if 'disabled' not in classes.lower() and aria_disabled != 'true':
                                logger.info(f"Clicking next page button: {selector}")
                                self.driver_manager.driver.execute_script(
                                    "arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});",
                                    elem
                                )
                                time.sleep(0.5)
                                try:
                                    elem.click()
                                except Exception:
                                    self.driver_manager.driver.execute_script("arguments[0].click();", elem)
                                time.sleep(2)
                                return True
                    except Exception as elem_error:
                        logger.debug(f"Element interaction error: {elem_error}")
                        continue
            except Exception as e:
                logger.debug(f"Could not find/click {selector}: {e}")
                continue

        return False

    def get_current_page_number(self, soup: BeautifulSoup) -> int:
        """
        Get the current page number from the page.

        Args:
            soup: BeautifulSoup object of the page.

        Returns:
            Current page number, or 1 if can't determine.
        """
        # Look for active/current page indicator
        active_selectors = [
            '.pagination .active', '.pagination .current',
            '[aria-current="page"]', '.page-item.active',
            '[class*="pagination"] [class*="active"]',
            '[class*="pagination"] [class*="current"]',
        ]

        for selector in active_selectors:
            elem = soup.select_one(selector)
            if elem:
                text = elem.get_text(strip=True)
                if text.isdigit():
                    return int(text)

        # Check URL for page parameter
        return 1

    def click_page_number(self, page_num: int) -> bool:
        """
        Click a specific page number button.
        Handles Shadow DOM elements used by Salesforce LWC.

        Args:
            page_num: The page number to click.

        Returns:
            True if page was clicked successfully.
        """
        if not self.driver_manager.driver:
            return False

        # First, scroll to bottom of page to ensure pagination is visible
        try:
            self.driver_manager.driver.execute_script(
                "window.scrollTo(0, document.body.scrollHeight);"
            )
            time.sleep(1)
        except Exception:
            pass

        # Try using JavaScript to find and click the page button
        # This works with Shadow DOM elements
        js_click_page = f"""
        // Function to find element in shadow DOM
        function querySelectorAllDeep(selector, root = document) {{
            const elements = [];
            const traverse = (node) => {{
                if (node.nodeType === Node.ELEMENT_NODE) {{
                    if (node.matches && node.matches(selector)) {{
                        elements.push(node);
                    }}
                    if (node.shadowRoot) {{
                        traverse(node.shadowRoot);
                    }}
                }}
                node.childNodes.forEach(child => traverse(child));
            }};
            traverse(root);
            return elements;
        }}

        // Try to find page {page_num} button
        const selectors = [
            '[aria-label="Go to page {page_num}"]',
            'button[aria-label="Go to page {page_num}"]'
        ];

        for (const selector of selectors) {{
            let btn = document.querySelector(selector);
            if (!btn) {{
                const found = querySelectorAllDeep(selector);
                if (found.length > 0) {{
                    btn = found[0];
                }}
            }}
            if (btn && !btn.disabled && btn.offsetParent !== null) {{
                btn.scrollIntoView({{behavior: 'smooth', block: 'center'}});
                btn.click();
                return true;
            }}
        }}
        return false;
        """

        try:
            result = self.driver_manager.driver.execute_script(js_click_page)
            if result:
                logger.info(f"Clicked page {page_num} button via JavaScript")
                time.sleep(2)  # Wait for page to load
                return True
        except Exception as e:
            logger.debug(f"JavaScript click for page {page_num} failed: {e}")

        # Fallback to regular Selenium selectors
        page_selectors = [
            f'button[aria-label="Go to page {page_num}"]',
            f'[aria-label="Go to page {page_num}"]',
            f'a[aria-label="Go to page {page_num}"]',
        ]

        for selector in page_selectors:
            try:
                elements = self.driver_manager.driver.find_elements(By.CSS_SELECTOR, selector)
                logger.debug(f"Found {len(elements)} elements for page {page_num} selector: {selector}")
                for elem in elements:
                    try:
                        if elem.is_displayed() and elem.is_enabled():
                            logger.info(f"Clicking page {page_num} button")
                            self.driver_manager.driver.execute_script(
                                "arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});",
                                elem
                            )
                            time.sleep(0.5)
                            try:
                                elem.click()
                            except Exception:
                                self.driver_manager.driver.execute_script("arguments[0].click();", elem)
                            time.sleep(2)
                            return True
                    except Exception as elem_error:
                        logger.debug(f"Element interaction error: {elem_error}")
                        continue
            except Exception as e:
                logger.debug(f"Could not click page {page_num}: {e}")
                continue

        return False

    def handle_load_more(self) -> bool:
        """
        Handle 'Load More' buttons for infinite scroll pages.

        Returns:
            True if more content was loaded.
        """
        load_more_selectors = [
            '.load-more', '.show-more', '[data-action="load-more"]',
            'button.more', '.btn-load-more', '#load-more',
        ]

        for selector in load_more_selectors:
            if self.driver_manager.click_element(selector):
                time.sleep(2)  # Wait for content to load
                return True

        return False

    def scrape_category(self, category_name: str, category_url: str) -> list[Product]:
        """
        Scrape all products from a category.

        Args:
            category_name: Name of the category.
            category_url: URL of the category page.

        Returns:
            List of Product objects.
        """
        logger.info(f"=== Scraping category: {category_name} ===")
        category_products = []

        # Build full URL
        if not category_url.startswith('http'):
            category_url = urljoin(self.BASE_URL, category_url)

        # Get initial page (save debug HTML on first category page)
        soup = self._fetch_page_with_scroll(category_url, wait_for='.product-item, .product-card, .product, .plp-card', save_debug=True)
        if not soup:
            return category_products

        # Check total pages available
        total_pages = self.get_total_pages(soup)
        logger.info(f"Detected {total_pages} total pages in category")

        # Collect all product URLs from listing pages
        product_infos = []
        existing_urls = set()
        pages_scraped = set()
        current_page = 1
        max_pages = 100  # Safety limit to prevent infinite loops

        # First, get products from initial page
        page_products = self.scrape_category_page(category_url, category_name, soup=soup)
        for p in page_products:
            if p['url'] not in existing_urls:
                product_infos.append(p)
                existing_urls.add(p['url'])
        pages_scraped.add(category_url)
        logger.info(f"Page {current_page}: Found {len(page_products)} products (total: {len(product_infos)})")

        # Try load more button first (for infinite scroll pages)
        load_more_count = 0
        while self.handle_load_more() and load_more_count < 50:
            load_more_count += 1
            # Re-parse after loading more
            new_html = self.driver_manager.driver.page_source
            new_soup = BeautifulSoup(new_html, 'html.parser')
            new_products = self.scrape_category_page(category_url, category_name, soup=new_soup)
            new_count = 0
            for p in new_products:
                if p['url'] not in existing_urls:
                    product_infos.append(p)
                    existing_urls.add(p['url'])
                    new_count += 1
            logger.info(f"Load more #{load_more_count}: Found {new_count} new products (total: {len(product_infos)})")

            # Check limit
            if self.max_products_per_category and len(product_infos) >= self.max_products_per_category:
                break

            # If no new products loaded, stop trying load more
            if new_count == 0:
                break

        # Try AJAX next page button pagination
        if not load_more_count:  # Only if load more didn't work
            consecutive_empty = 0
            next_page_failed = False

            while current_page < max_pages and consecutive_empty < 3 and not next_page_failed:
                # Check limit before trying next page
                if self.max_products_per_category and len(product_infos) >= self.max_products_per_category:
                    logger.info(f"Reached max products limit ({self.max_products_per_category})")
                    break

                # Try clicking next page button first
                clicked = self.click_next_page()

                # If next page button didn't work, try clicking specific page number
                if not clicked:
                    clicked = self.click_page_number(current_page + 1)

                if clicked:
                    current_page += 1
                    # Wait a bit more for the page to fully load
                    time.sleep(1)

                    # Re-parse the page after navigation
                    new_html = self.driver_manager.driver.page_source
                    new_soup = BeautifulSoup(new_html, 'html.parser')

                    new_products = self.scrape_category_page(category_url, category_name, soup=new_soup)
                    new_count = 0
                    for p in new_products:
                        if p['url'] not in existing_urls:
                            product_infos.append(p)
                            existing_urls.add(p['url'])
                            new_count += 1

                    logger.info(f"Page {current_page}: Found {new_count} new products (total: {len(product_infos)})")

                    if new_count == 0:
                        consecutive_empty += 1
                    else:
                        consecutive_empty = 0
                else:
                    # No more next page button found
                    next_page_failed = True
                    logger.info("No more pagination buttons found")

        # Try URL-based pagination (e.g., ?page=2 or /page/2/)
        # Get pagination URLs from current page
        current_html = self.driver_manager.driver.page_source if self.driver_manager.driver else None
        if current_html:
            current_soup = BeautifulSoup(current_html, 'html.parser')
            pagination_urls = self.get_pagination_urls(current_soup, category_url)

            for page_url in pagination_urls:
                if page_url in pages_scraped:
                    continue

                # Check limit
                if self.max_products_per_category and len(product_infos) >= self.max_products_per_category:
                    break

                pages_scraped.add(page_url)
                page_soup = self._fetch_page_with_scroll(page_url, wait_for='.product-item, .product-card, .product, .plp-card')

                if page_soup:
                    new_products = self.scrape_category_page(page_url, category_name, soup=page_soup)
                    new_count = 0
                    for p in new_products:
                        if p['url'] not in existing_urls:
                            product_infos.append(p)
                            existing_urls.add(p['url'])
                            new_count += 1
                    logger.info(f"Pagination URL: Found {new_count} new products (total: {len(product_infos)})")

        # Apply max products limit if set
        if self.max_products_per_category and len(product_infos) > self.max_products_per_category:
            product_infos = product_infos[:self.max_products_per_category]

        logger.info(f"Found {len(product_infos)} product URLs in {category_name}")

        # Scrape individual product pages
        for idx, info in enumerate(product_infos, 1):
            logger.info(f"Processing product {idx}/{len(product_infos)}")
            product = self.scrape_product_page(info['url'], category_name)
            if product:
                category_products.append(product)

        return category_products

    def run(self) -> list[Product]:
        """
        Run the full scraping process.

        Returns:
            List of all scraped products.
        """
        logger.info("Starting FleetPride scraper with Selenium...")

        with self.driver_manager.managed_session():
            # Discover categories
            all_categories = self.discover_categories()

            # Filter to selected categories
            categories_to_scrape = self._get_filtered_categories(all_categories)

            if not categories_to_scrape:
                logger.error("No valid categories to scrape!")
                return []

            logger.info(f"Will scrape {len(categories_to_scrape)} categories: {list(categories_to_scrape.keys())}")

            # Scrape each category
            for cat_name, cat_url in categories_to_scrape.items():
                category_products = self.scrape_category(cat_name, cat_url)
                self.products.extend(category_products)
                logger.info(f"Total products so far: {len(self.products)}")

        # Save results
        self.save_results()

        return self.products

    def save_results(self):
        """Save scraped products to JSON file."""
        output = {
            "scraped_at": datetime.now().isoformat(),
            "total_products": len(self.products),
            "categories_scraped": list(set(p.category for p in self.products)),
            "products": [asdict(p) for p in self.products],
            "errors": self.errors,
        }

        with open(self.output_file, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)

        logger.info(f"Saved {len(self.products)} products to {self.output_file}")

        # Also save a CSV for easier viewing
        csv_file = Path(self.output_file).with_suffix('.csv')
        self._save_csv(csv_file)

    def _save_csv(self, filepath: Path):
        """Save products to CSV file."""
        if not self.products:
            return

        fieldnames = ['part_number', 'sku', 'name', 'brand', 'category',
                      'subcategory', 'price', 'description', 'features',
                      'specifications', 'url', 'image_url', 'scraped_at']

        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for product in self.products:
                row = {}
                for k in fieldnames:
                    val = getattr(product, k, '')
                    # Convert lists and dicts to JSON strings for CSV
                    if isinstance(val, (list, dict)):
                        row[k] = json.dumps(val, ensure_ascii=False)
                    else:
                        row[k] = val
                writer.writerow(row)

        logger.info(f"Saved CSV to {filepath}")


def main():
    parser = argparse.ArgumentParser(
        description="Scrape FleetPride.com for product information using Selenium"
    )
    parser.add_argument(
        '--categories', '-c',
        type=str,
        help='Comma-separated list of categories to scrape (e.g., "brakes,filters,lighting")'
    )
    parser.add_argument(
        '--output', '-o',
        type=str,
        default='fleetpride_products.json',
        help='Output file path (default: fleetpride_products.json)'
    )
    parser.add_argument(
        '--delay', '-d',
        type=float,
        default=2.0,
        help='Delay between requests in seconds (default: 2.0)'
    )
    parser.add_argument(
        '--max-products', '-m',
        type=int,
        default=None,
        help='Maximum products to scrape per category (for testing)'
    )
    parser.add_argument(
        '--list-categories',
        action='store_true',
        help='List known categories and exit'
    )
    parser.add_argument(
        '--no-headless',
        action='store_true',
        help='Run browser in visible mode (not headless)'
    )
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable verbose/debug logging'
    )

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    if args.list_categories:
        print("Known FleetPride categories:")
        for cat in sorted(FleetPrideScraper.KNOWN_CATEGORIES.keys()):
            print(f"  - {cat}")
        return

    categories = None
    if args.categories:
        categories = [c.strip() for c in args.categories.split(',')]

    scraper = FleetPrideScraper(
        categories=categories,
        delay=args.delay,
        max_products_per_category=args.max_products,
        output_file=args.output,
        headless=not args.no_headless
    )

    products = scraper.run()

    print(f"\n{'='*50}")
    print(f"Scraping complete!")
    print(f"Total products: {len(products)}")
    print(f"Output file: {args.output}")
    if scraper.errors:
        print(f"Errors encountered: {len(scraper.errors)}")


if __name__ == "__main__":
    main()
