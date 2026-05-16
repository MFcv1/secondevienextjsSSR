import argparse
import asyncio
import json
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen
from urllib.error import URLError


# Legacy Vite-only probe kept for old SPA comparisons.
# For the Next SSR clone, prefer `npm run perf:budget` and `npm run perf:architecture`.
DEFAULT_ROUTES = [
    ("/", 7000),
    ("/categorie/commodes", 6000),
]

DEFAULT_BASELINE_PATH = Path(__file__).with_name("perf-network-baseline.json")
LOWER_IS_BETTER_BASELINE_FIELDS = [
    "requestCount",
    "totalTransferBytes",
    "imageBytes",
    "jsBytes",
]

WEB_VITAL_BUDGETS = {
    "lcpMs": 2500,
    "cls": 0.1,
    "maxInteractionMs": 200,
}

NETWORK_BUDGETS = {
    "/": {
        "requestCount": 60,
        "totalTransferBytes": 1_000_000,
        "imageBytes": 550_000,
        "jsBytes": 450_000,
    },
    "/categorie/commodes": {
        "requestCount": 60,
        "totalTransferBytes": 650_000,
        "imageBytes": 140_000,
        "jsBytes": 420_000,
    },
}

FORBIDDEN_REQUEST_FIELDS = [
    "productDetailRequests",
    "firebaseStorageRequests",
    "testimonialsRequests",
    "invoiceRequests",
    "stripeRequests",
    "unsplashRequests",
    "materialSymbolsRequests",
]

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def is_serving(base_url):
    try:
        with urlopen(base_url, timeout=1.5) as response:
            return 200 <= response.status < 500
    except URLError:
        return False
    except Exception:
        return False


def start_preview(base_url, host, port):
    if is_serving(base_url):
        return None

    command = [
        "npm.cmd" if sys.platform.startswith("win") else "npm",
        "run",
        "preview",
        "--",
        "--host",
        host,
        "--port",
        str(port),
    ]
    process = subprocess.Popen(
        command,
        cwd=Path(__file__).resolve().parents[1],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    deadline = time.time() + 20
    while time.time() < deadline:
        if process.poll() is not None:
            raise RuntimeError("vite preview exited before becoming reachable")
        if is_serving(base_url):
            return process
        time.sleep(0.25)

    process.terminate()
    raise RuntimeError(f"preview did not become reachable at {base_url}")


def load_baseline(path):
    if not path:
        return {}
    baseline_path = Path(path)
    if not baseline_path.exists():
        return {}
    with baseline_path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    return payload.get("routes", {})


def attach_baseline_comparisons(results, baseline_routes):
    for result in results:
        route_baseline = baseline_routes.get(result["path"])
        if not route_baseline:
            continue

        minimum_savings = route_baseline.get("minimumSavings", {})
        comparison = {}
        for key in LOWER_IS_BETTER_BASELINE_FIELDS:
            if key not in route_baseline or key not in result:
                continue
            baseline_value = route_baseline[key]
            current_value = result[key]
            delta = current_value - baseline_value
            saved = baseline_value - current_value
            target = minimum_savings.get(key, 0)
            comparison[key] = {
                "baseline": baseline_value,
                "current": current_value,
                "delta": delta,
                "percentChange": round((delta / baseline_value) * 100, 1) if baseline_value else None,
                "minimumSavings": target,
                "passed": current_value < baseline_value and saved >= target,
            }
        result["baselineComparison"] = comparison


async def measure_route(playwright, base_url, path, wait_ms):
    browser = await playwright.chromium.launch(headless=True)
    context = await browser.new_context(
        viewport={"width": 390, "height": 844},
        is_mobile=True,
        has_touch=True,
        device_scale_factor=3,
    )
    page = await context.new_page()
    console = []
    page.on("console", lambda msg: console.append({"type": msg.type, "text": msg.text[:180]}))
    await page.add_init_script(
        """
(() => {
  window.__svPerfVitals = {
    lcpMs: 0,
    cls: 0,
    maxInteractionMs: 0,
    interactionCount: 0,
  };

  const observe = (type, callback, options = {}) => {
    try {
      if (!PerformanceObserver.supportedEntryTypes?.includes(type)) return;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) callback(entry);
      });
      observer.observe({ type, buffered: true, ...options });
    } catch (_) {}
  };

  observe('largest-contentful-paint', (entry) => {
    window.__svPerfVitals.lcpMs = Math.round(entry.startTime);
  });

  observe('layout-shift', (entry) => {
    if (entry.hadRecentInput) return;
    window.__svPerfVitals.cls += entry.value;
    window.__svPerfVitals.cls = Number(window.__svPerfVitals.cls.toFixed(4));
  });

  observe('event', (entry) => {
    if (!entry.interactionId) return;
    window.__svPerfVitals.interactionCount += 1;
    window.__svPerfVitals.maxInteractionMs = Math.max(
      window.__svPerfVitals.maxInteractionMs,
      Math.round(entry.duration || 0)
    );
  }, { durationThreshold: 16 });
})();
"""
    )

    await page.goto(f"{base_url}{path}", wait_until="domcontentloaded", timeout=45000)
    await page.wait_for_timeout(wait_ms)
    entries = await page.evaluate(
        """
() => performance.getEntriesByType('resource').map((e) => ({
  name: e.name,
  initiatorType: e.initiatorType,
  transferSize: e.transferSize || 0,
  encodedBodySize: e.encodedBodySize || 0
}))
"""
    )
    html_transfer = await page.evaluate("performance.getEntriesByType('navigation')[0]?.transferSize || 0")
    title = await page.title()
    body_sample = (await page.locator("body").inner_text(timeout=5000))[:220].replace("\n", " ")

    try:
        await page.get_by_label("Ouvrir le menu").click(timeout=5000)
        await page.wait_for_timeout(900)
    except Exception:
        console.append({"type": "warning", "text": "interaction probe skipped: menu button not found"})

    web_vitals = await page.evaluate("window.__svPerfVitals || {}")
    await browser.close()

    def bytes_for(items):
        return sum(entry.get("transferSize") or entry.get("encodedBodySize") or 0 for entry in items)

    def find(substr):
        needle = substr.lower()
        return [entry for entry in entries if needle in entry["name"].lower()]

    images = [
        entry
        for entry in entries
        if entry["initiatorType"] == "img"
        or any(ext in entry["name"].lower() for ext in [".webp", ".jpg", ".jpeg", ".png", "firebasestorage.googleapis.com"])
    ]
    scripts = [entry for entry in entries if entry["initiatorType"] == "script" or entry["name"].lower().endswith(".js")]
    styles = [entry for entry in entries if entry["initiatorType"] == "link" and entry["name"].lower().endswith(".css")]

    vital_budget_status = {
        "lcp": (web_vitals.get("lcpMs") or 0) <= WEB_VITAL_BUDGETS["lcpMs"] if web_vitals.get("lcpMs") else None,
        "cls": (web_vitals.get("cls") or 0) <= WEB_VITAL_BUDGETS["cls"],
        "interaction": (
            (web_vitals.get("interactionCount") or 0) > 0
            and (web_vitals.get("maxInteractionMs") or 0) <= WEB_VITAL_BUDGETS["maxInteractionMs"]
        ),
    }

    result = {
        "path": path,
        "title": title,
        "requestCount": 1 + len(entries),
        "totalTransferBytes": html_transfer + bytes_for(entries),
        "imageRequests": len(images),
        "imageBytes": bytes_for(images),
        "jsRequests": len(scripts),
        "jsBytes": bytes_for(scripts),
        "cssRequests": len(styles),
        "cssBytes": bytes_for(styles),
        "productDetailRequests": len(find("ProductDetail-")),
        "firebaseStorageRequests": len(find("firebase-storage-")),
        "categoryCatalogLoaderRequests": len(find("categoryCatalogLoader-")),
        "categoryPageRequests": len(find("CategoryPage-")),
        "testimonialsRequests": len(find("CustomerTestimonialsCarousel-")),
        "invoiceRequests": len(find("generateInvoice-")),
        "stripeRequests": len(find("CheckoutStripeModal-")),
        "unsplashRequests": len(find("unsplash")),
        "materialSymbolsRequests": len(find("Material+Symbols")),
        "webVitals": web_vitals,
        "webVitalBudgets": WEB_VITAL_BUDGETS,
        "webVitalBudgetStatus": vital_budget_status,
        "consoleWarnings": [entry for entry in console if entry["type"] in ("warning", "error")][:8],
        "bodySample": body_sample,
    }
    result["networkBudgets"] = NETWORK_BUDGETS.get(path, {})
    result["networkBudgetStatus"] = {
        key: result[key] <= limit for key, limit in result["networkBudgets"].items()
    }
    result["forbiddenRequestStatus"] = {
        key: result[key] == 0 for key in FORBIDDEN_REQUEST_FIELDS
    }
    return result


async def run_measurements(base_url):
    try:
        from playwright.async_api import async_playwright
    except ImportError as exc:
        raise RuntimeError("Python Playwright is required: python -m pip install playwright && python -m playwright install chromium") from exc

    async with async_playwright() as playwright:
        results = []
        for path, wait_ms in DEFAULT_ROUTES:
            results.append(await measure_route(playwright, base_url, path, wait_ms))
        return results


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Legacy Vite preview network probe. "
            "For the Next SSR clone, use npm run perf:budget or npm run perf:architecture."
        )
    )
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=4173)
    parser.add_argument("--no-preview", action="store_true", help="Use an already running preview server.")
    parser.add_argument("--baseline", default=str(DEFAULT_BASELINE_PATH), help="Optional JSON baseline used to prove before/after gains.")
    parser.add_argument("--no-baseline", action="store_true", help="Skip baseline comparison.")
    args = parser.parse_args()

    base_url = f"http://{args.host}:{args.port}"
    baseline_routes = {} if args.no_baseline else load_baseline(args.baseline)
    process = None
    try:
        print(
            "Warning: measure-preview-network.py is legacy Vite tooling; "
            "Next SSR gates are npm run perf:budget and npm run perf:architecture.",
            file=sys.stderr,
        )
        if not args.no_preview:
            process = start_preview(base_url, args.host, args.port)
        elif not is_serving(base_url):
            raise RuntimeError(f"No preview server reachable at {base_url}")

        results = asyncio.run(run_measurements(base_url))
        attach_baseline_comparisons(results, baseline_routes)
        print(json.dumps(results, indent=2, ensure_ascii=False))
        failures = []
        for result in results:
            path = result["path"]
            for key, passed in result.get("networkBudgetStatus", {}).items():
                if not passed:
                    failures.append(f"{path}: network budget {key} exceeded")
            for key, passed in result.get("webVitalBudgetStatus", {}).items():
                if passed is not True:
                    failures.append(f"{path}: web vital budget {key} failed or unavailable")
            for key, passed in result.get("forbiddenRequestStatus", {}).items():
                if not passed:
                    failures.append(f"{path}: forbidden request field {key} is non-zero")
            for key, comparison in result.get("baselineComparison", {}).items():
                if comparison.get("passed") is not True:
                    failures.append(
                        f"{path}: baseline improvement for {key} failed "
                        f"(baseline={comparison.get('baseline')}, current={comparison.get('current')}, "
                        f"minimumSavings={comparison.get('minimumSavings')})"
                    )
        if failures:
            print("\nPerformance network gate failed:", file=sys.stderr)
            for failure in failures:
                print(f"- {failure}", file=sys.stderr)
            raise SystemExit(1)
    finally:
        if process:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()


if __name__ == "__main__":
    main()
