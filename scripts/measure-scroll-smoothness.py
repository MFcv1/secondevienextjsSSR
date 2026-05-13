import argparse
import asyncio
import json
import subprocess
import sys
import time
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen


DEFAULT_ROUTES = [
    ("/", "desktop-home-first-scroll"),
]

SCROLL_BUDGETS = {
    "maxFrameGapMs": 90,
    "over50msFrames": 8,
    "over100msFrames": 1,
    "loadMaxFrameGapMs": 140,
    "loadOver50msFrames": 8,
    "loadOver100msFrames": 2,
    "longTaskCount": 4,
    "maxLongTaskMs": 160,
    "layoutShiftTotal": 0.1,
}

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def is_serving(base_url):
    try:
        with urlopen(base_url, timeout=1.5) as response:
            return 200 <= response.status < 500
    except (URLError, Exception):
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


async def measure_route(playwright, base_url, path, label):
    browser = await playwright.chromium.launch(headless=True)
    context = await browser.new_context(
        viewport={"width": 1440, "height": 950},
        device_scale_factor=1,
    )
    page = await context.new_page()
    console = []
    page.on("console", lambda msg: console.append({"type": msg.type, "text": msg.text[:180]}))

    await page.add_init_script(
        """
(() => {
  window.__svLoadProbe = {
    active: true,
    startedAt: performance.now(),
    previous: performance.now(),
    frameTimes: [],
  };
  const tickLoad = (now) => {
    const probe = window.__svLoadProbe;
    if (!probe?.active) return;

    probe.frameTimes.push(Math.round((now - probe.previous) * 10) / 10);
    probe.previous = now;
    requestAnimationFrame(tickLoad);
  };
  requestAnimationFrame(tickLoad);

  window.__svLongTasks = [];
  window.__svLayoutShifts = [];
  try {
    if (PerformanceObserver.supportedEntryTypes?.includes('longtask')) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__svLongTasks.push({
            startTime: Math.round(entry.startTime),
            duration: Math.round(entry.duration)
          });
        }
      }).observe({ type: 'longtask', buffered: true });
    }
    if (PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.hadRecentInput) continue;
          window.__svLayoutShifts.push({
            startTime: Math.round(entry.startTime),
            value: Number(entry.value.toFixed(4)),
            sources: (entry.sources || []).slice(0, 4).map((source) => {
              const node = source.node;
              return {
                node: node ? `${node.tagName || ''}${node.id ? `#${node.id}` : ''}${node.className ? `.${String(node.className).trim().replace(/\\s+/g, '.')}` : ''}` : null,
                previousRect: source.previousRect ? {
                  x: Math.round(source.previousRect.x),
                  y: Math.round(source.previousRect.y),
                  width: Math.round(source.previousRect.width),
                  height: Math.round(source.previousRect.height)
                } : null,
                currentRect: source.currentRect ? {
                  x: Math.round(source.currentRect.x),
                  y: Math.round(source.currentRect.y),
                  width: Math.round(source.currentRect.width),
                  height: Math.round(source.currentRect.height)
                } : null
              };
            })
          });
        }
      }).observe({ type: 'layout-shift', buffered: true });
    }
  } catch (_) {}
})();
"""
    )

    await page.goto(f"{base_url}{path}", wait_until="domcontentloaded", timeout=45000)
    await page.wait_for_timeout(1200)
    title = await page.title()

    await page.evaluate(
        """
() => {
  window.__svScrollProbe = {
    active: true,
    startedAt: performance.now(),
    previous: performance.now(),
    frameTimes: [],
    scrollSamples: [],
  };

  const tick = (now) => {
    const probe = window.__svScrollProbe;
    if (!probe?.active) return;

    probe.frameTimes.push(Math.round((now - probe.previous) * 10) / 10);
    probe.previous = now;
    if (probe.scrollSamples.length < 18 || probe.scrollSamples.length % 20 === 0) {
      probe.scrollSamples.push({
        t: Math.round(now - probe.startedAt),
        y: Math.round(window.scrollY),
      });
    }
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}
"""
    )

    for _ in range(26):
        await page.mouse.wheel(0, 420)
        await page.wait_for_timeout(55)

    await page.wait_for_timeout(1400)

    result = await page.evaluate(
        """
() => {
  const probe = window.__svScrollProbe || { frameTimes: [], scrollSamples: [], startedAt: performance.now() };
  probe.active = false;
  const measuredFrames = probe.frameTimes.slice(1);
  const loadProbe = window.__svLoadProbe || { frameTimes: [] };
  loadProbe.active = false;
  const loadFrames = loadProbe.frameTimes.slice(1);
  const over50 = measuredFrames.filter((value) => value > 50);
  const over100 = measuredFrames.filter((value) => value > 100);
  const over200 = measuredFrames.filter((value) => value > 200);
  const loadOver50 = loadFrames.filter((value) => value > 50);
  const loadOver100 = loadFrames.filter((value) => value > 100);
  const longTasks = window.__svLongTasks || [];
  const layoutShifts = window.__svLayoutShifts || [];

  return {
    startY: 0,
    targetY: 'wheel-26x420',
    finalY: Math.round(window.scrollY),
    scrollHeight: document.documentElement.scrollHeight,
    frameCount: measuredFrames.length,
    averageFrameGapMs: Number((measuredFrames.reduce((sum, value) => sum + value, 0) / Math.max(1, measuredFrames.length)).toFixed(1)),
    maxFrameGapMs: Math.max(0, ...measuredFrames),
    over50msFrames: over50.length,
    over100msFrames: over100.length,
    over200msFrames: over200.length,
    worstFrameGapsMs: measuredFrames.slice().sort((a, b) => b - a).slice(0, 8),
    loadFrameCount: loadFrames.length,
    loadMaxFrameGapMs: Math.max(0, ...loadFrames),
    loadOver50msFrames: loadOver50.length,
    loadOver100msFrames: loadOver100.length,
    loadWorstFrameGapsMs: loadFrames.slice().sort((a, b) => b - a).slice(0, 8),
    longTaskCount: longTasks.length,
    maxLongTaskMs: Math.max(0, ...longTasks.map((task) => task.duration || 0)),
    worstLongTasks: longTasks.slice().sort((a, b) => b.duration - a.duration).slice(0, 8),
    layoutShiftCount: layoutShifts.length,
    layoutShiftTotal: Number(layoutShifts.reduce((sum, entry) => sum + entry.value, 0).toFixed(4)),
    worstLayoutShifts: layoutShifts.slice().sort((a, b) => b.value - a.value).slice(0, 8),
    scrollSamples: probe.scrollSamples,
  };
}
"""
    )
    await browser.close()

    budget_status = {}
    for key, limit in SCROLL_BUDGETS.items():
        budget_status[key] = result.get(key, 0) <= limit

    return {
        "path": path,
        "label": label,
        "title": title,
        **result,
        "scrollBudgets": SCROLL_BUDGETS,
        "scrollBudgetStatus": budget_status,
        "consoleWarnings": [entry for entry in console if entry["type"] in ("warning", "error")][:8],
    }


async def run_measurements(base_url):
    try:
        from playwright.async_api import async_playwright
    except ImportError as exc:
        raise RuntimeError("Python Playwright is required: python -m pip install playwright && python -m playwright install chromium") from exc

    async with async_playwright() as playwright:
        return [
            await measure_route(playwright, base_url, path, label)
            for path, label in DEFAULT_ROUTES
        ]


def main():
    parser = argparse.ArgumentParser(description="Measure desktop first-scroll smoothness on Vite preview.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=4173)
    parser.add_argument("--no-preview", action="store_true", help="Use an already running preview server.")
    args = parser.parse_args()

    base_url = f"http://{args.host}:{args.port}"
    process = None
    try:
        if not args.no_preview:
            process = start_preview(base_url, args.host, args.port)
        elif not is_serving(base_url):
            raise RuntimeError(f"No preview server reachable at {base_url}")

        results = asyncio.run(run_measurements(base_url))
        print(json.dumps(results, indent=2, ensure_ascii=False))

        failures = []
        for result in results:
            for key, passed in result["scrollBudgetStatus"].items():
                if not passed:
                    failures.append(f"{result['path']}: scroll budget {key} exceeded")
        if failures:
            print("\nScroll smoothness gate failed:", file=sys.stderr)
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
