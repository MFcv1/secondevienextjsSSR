import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_URL = 'http://127.0.0.1:4300/';
const VIEWPORT = { width: 1440, height: 950 };
const TRACE_CATEGORIES = [
  'devtools.timeline',
  'disabled-by-default-devtools.timeline',
  'blink.user_timing',
  'loading',
  'v8',
  'cc',
  'disabled-by-default-devtools.timeline.frame',
];

const argv = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (!arg.startsWith('--')) continue;
  const [key, inlineValue] = arg.slice(2).split('=');
  const value = inlineValue ?? process.argv[index + 1];
  argv.set(key, value === undefined || value.startsWith('--') ? true : value);
  if (inlineValue === undefined && value && !value.startsWith('--')) index += 1;
}

const targetUrl = String(argv.get('url') || DEFAULT_URL);
const label = String(argv.get('label') || new URL(targetUrl).hostname.replace(/[^a-z0-9-]+/gi, '-'));
const throttle = Number(argv.get('throttle') || 4);
const outDir = path.resolve(String(argv.get('out') || path.join('logs', 'scroll-audit', label)));
const enableTrace = argv.get('trace') !== 'false';
const mode = String(argv.get('mode') || (argv.has('immediate') ? 'immediate' : 'standard'));
const immediateSteps = Number(argv.get('steps') || 5);
const immediateDeltaY = Number(argv.get('deltaY') || 80);

const nowStamp = () => new Date().toISOString().replace(/[:.]/g, '-');
const runId = nowStamp();

const classifyUrl = (url, resourceType = '', mimeType = '') => {
  const lower = url.toLowerCase();
  const host = (() => {
    try { return new URL(url).hostname; } catch { return ''; }
  })();

  if (resourceType === 'Script' || /\.m?js(\?|$)/.test(lower)) return 'script';
  if (resourceType === 'Stylesheet' || /\.css(\?|$)/.test(lower)) return 'stylesheet';
  if (resourceType === 'Image' || mimeType.startsWith('image/') || /\.(avif|webp|png|jpe?g|gif|svg)(\?|$)/.test(lower)) return 'image';
  if (lower.includes('firestore.googleapis.com') || lower.includes('google.firestore')) return 'firestore';
  if (lower.includes('identitytoolkit.googleapis.com') || lower.includes('/auth/')) return 'auth';
  if (lower.includes('google-analytics.com') || lower.includes('googletagmanager.com') || lower.includes('analytics')) return 'analytics';
  if (lower.includes('cloudfunctions.net')) return 'cloud-function';
  if (lower.includes('firebase') || lower.includes('appcheck') || lower.includes('recaptcha')) return 'firebase';
  if (host.includes('debongout-paris.com')) return 'document-site';
  return resourceType ? resourceType.toLowerCase() : 'other';
};

const isProductImage = (url) => /firebasestorage\.googleapis\.com|storage\.googleapis\.com/.test(url) &&
  /furniture|thumbnails|responsive|product|meuble/i.test(url);

const shortUrl = (url) => {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.length > 92
      ? `${parsed.pathname.slice(0, 55)}...${parsed.pathname.slice(-28)}`
      : parsed.pathname;
    return `${parsed.hostname}${pathname}${parsed.search ? '?' : ''}`;
  } catch {
    return url.slice(0, 130);
  }
};

const readTraceStream = async (session, stream) => {
  const chunks = [];
  let eof = false;
  while (!eof) {
    const response = await session.send('IO.read', { handle: stream });
    if (response.data) chunks.push(response.data);
    eof = Boolean(response.eof);
  }
  await session.send('IO.close', { handle: stream });
  return chunks.join('');
};

const summarizeTrace = (trace) => {
  const events = Array.isArray(trace?.traceEvents) ? trace.traceEvents : [];
  const buckets = {
    scripting: { ms: 0, events: {} },
    renderingLayoutStyle: { ms: 0, events: {} },
    paintRasterComposite: { ms: 0, events: {} },
    imageDecode: { ms: 0, events: {} },
    garbageCollection: { ms: 0, events: {} },
    loading: { ms: 0, events: {} },
  };

  const add = (bucket, name, dur) => {
    const ms = dur / 1000;
    buckets[bucket].ms += ms;
    buckets[bucket].events[name] = (buckets[bucket].events[name] || 0) + ms;
  };

  for (const event of events) {
    if (event.ph !== 'X' || !event.dur) continue;
    const name = event.name || '';
    const cat = event.cat || '';

    if (/EvaluateScript|FunctionCall|EventDispatch|TimerFire|FireAnimationFrame|RunMicrotasks|v8|ParseScript|CompileScript|V8\.Execute/i.test(`${name} ${cat}`)) {
      add('scripting', name, event.dur);
    }
    if (/Layout|UpdateLayoutTree|RecalculateStyles|ScheduleStyle|InvalidateLayout/i.test(name)) {
      add('renderingLayoutStyle', name, event.dur);
    }
    if (/Paint|Raster|Composite|Commit|DrawFrame|Layerize|PrePaint/i.test(name)) {
      add('paintRasterComposite', name, event.dur);
    }
    if (/Decode Image|ImageDecode|ImageDecoder|PaintImage/i.test(name)) {
      add('imageDecode', name, event.dur);
    }
    if (/GC|GarbageCollect|V8\.GC/i.test(name)) {
      add('garbageCollection', name, event.dur);
    }
    if (/Resource|XHR|ParseHTML|loading/i.test(`${name} ${cat}`)) {
      add('loading', name, event.dur);
    }
  }

  return Object.fromEntries(Object.entries(buckets).map(([name, bucket]) => [
    name,
    {
      ms: Number(bucket.ms.toFixed(1)),
      topEvents: Object.entries(bucket.events)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([eventName, ms]) => ({ name: eventName, ms: Number(ms.toFixed(1)) })),
    },
  ]));
};

const setupPageInstrumentation = async (page) => {
  await page.addInitScript(() => {
    window.__svAudit = {
      segment: 'navigation',
      longTasks: [],
      frameGaps: [],
      marks: [],
    };

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__svAudit.longTasks.push({
            name: entry.name,
            start: entry.startTime,
            duration: entry.duration,
            segment: window.__svAudit.segment,
          });
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch {
      window.__svAudit.longTaskObserverUnavailable = true;
    }

    let lastFrame = performance.now();
    const tick = (time) => {
      const gap = time - lastFrame;
      if (gap > 24) {
        window.__svAudit.frameGaps.push({
          time,
          gap,
          segment: window.__svAudit.segment,
        });
      }
      lastFrame = time;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
};

const evaluateSnapshot = async (page, name) => {
  return page.evaluate((snapshotName) => {
    const textOf = (node) => (node?.textContent || '').replace(/\s+/g, ' ').trim();
    const headings = Array.from(document.querySelectorAll('h1,h2,h3')).map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        text: textOf(node).slice(0, 90),
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
      };
    }).filter((entry) => entry.text);

    const productCards = Array.from(document.querySelectorAll('.product-card-media'));
    const realImages = Array.from(document.querySelectorAll('img[data-real-image="true"]'));
    const visibleImages = Array.from(document.images).filter((image) => {
      const rect = image.getBoundingClientRect();
      return rect.bottom >= 0 && rect.top <= window.innerHeight && rect.right >= 0 && rect.left <= window.innerWidth;
    });

    return {
      name: snapshotName,
      time: Math.round(performance.now()),
      scrollY: Math.round(window.scrollY),
      documentHeight: Math.round(document.documentElement.scrollHeight),
      hydrated: document.documentElement.dataset.svClientHydrated || null,
      productCards: productCards.length,
      productCardImagesRequested: realImages.length,
      productCardImagesLoaded: productCards.filter((node) => node.dataset.imageLoaded === 'true').length,
      productCardImagesPendingReveal: productCards.filter((node) => node.dataset.imageReveal === 'pending').length,
      visibleImages: visibleImages.length,
      visibleImageSrcs: visibleImages.map((image) => image.currentSrc || image.src).filter(Boolean).slice(0, 18),
      scripts: Array.from(document.scripts).map((script) => script.src).filter(Boolean),
      nextScripts: Array.from(document.scripts).map((script) => script.src).filter((src) => src.includes('/_next/')),
      headings,
    };
  }, name);
};

const evaluateScrollLockState = async (page) => {
  return page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const htmlStyle = getComputedStyle(html);
    const bodyStyle = getComputedStyle(body);
    const hasHeading = (needle) => Array.from(document.querySelectorAll('h1,h2,h3')).some((node) => (
      (node.textContent || '').toLocaleLowerCase('fr-FR').includes(needle)
    ));

    return {
      time: Math.round(performance.now()),
      scrollY: Math.round(window.scrollY),
      documentHeight: Math.round(html.scrollHeight),
      hydrated: html.dataset.svClientHydrated || null,
      hasGalleryEntryScrollLock: html.classList.contains('gallery-entry-scroll-lock') || body.classList.contains('gallery-entry-scroll-lock'),
      htmlOverflow: htmlStyle.overflow,
      bodyOverflow: bodyStyle.overflow,
      htmlOverflowY: htmlStyle.overflowY,
      bodyOverflowY: bodyStyle.overflowY,
      petitesPrixMounted: hasHeading('petits prix'),
      testimonialsMounted: hasHeading('avis'),
      newsletterMounted: Boolean(document.querySelector('.discount-section')),
      footerMounted: Boolean(document.querySelector('footer')),
      productDetailMounted: Boolean(document.querySelector('[data-product-detail-fallback="true"]')),
    };
  });
};

const setSegment = async (page, segment, markers) => {
  markers.push({ segment, wallTime: Date.now() });
  await page.evaluate((nextSegment) => {
    window.__svAudit.segment = nextSegment;
    performance.mark(`sv-audit:${nextSegment}`);
  }, segment).catch(() => {});
};

const waitForLocalGallery = async (page) => {
  await page.waitForLoadState('domcontentloaded', { timeout: 45_000 });
  await page.waitForFunction(() => document.documentElement.dataset.svClientHydrated === 'true', null, { timeout: 45_000 }).catch(() => null);
  await page.waitForTimeout(3600);
  await page.waitForFunction(() => !document.documentElement.classList.contains('gallery-entry-scroll-lock'), null, { timeout: 20_000 }).catch(() => null);
};

const findHeadingTop = async (page, text) => {
  return page.evaluate((needle) => {
    const normalizedNeedle = needle.toLocaleLowerCase('fr-FR');
    const match = Array.from(document.querySelectorAll('h1,h2,h3')).find((node) => (
      (node.textContent || '').toLocaleLowerCase('fr-FR').includes(normalizedNeedle)
    ));
    if (!match) return null;
    const rect = match.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, text: match.textContent.trim() };
  }, text);
};

const wheelUntilHeading = async (page, text, maxSteps = 16) => {
  for (let index = 0; index < maxSteps; index += 1) {
    const heading = await findHeadingTop(page, text);
    if (heading && heading.top >= 80 && heading.top <= 460) return heading;
    await page.mouse.wheel(0, 680);
    await page.waitForTimeout(120);
  }
  return findHeadingTop(page, text);
};

const fastWheel = async (page, steps, deltaY = 740) => {
  for (let index = 0; index < steps; index += 1) {
    await page.mouse.wheel(0, deltaY);
    await page.waitForTimeout(105);
  }
};

const runImmediateScroll = async (page, snapshots) => {
  const samples = [];
  await page.mouse.move(Math.round(VIEWPORT.width / 2), Math.round(VIEWPORT.height / 2));

  for (let index = 0; index < immediateSteps; index += 1) {
    await page.mouse.wheel(0, immediateDeltaY);
    await page.waitForTimeout(110);
    samples.push(await evaluateScrollLockState(page));
  }

  await page.waitForTimeout(1400);
  samples.push(await evaluateScrollLockState(page));
  snapshots.push(await evaluateSnapshot(page, 'immediate_scroll_after'));

  const firstPositiveScroll = samples.find((sample) => sample.scrollY > 0);
  const firstScrollable = samples.find((sample) => sample.documentHeight > VIEWPORT.height);
  const lockedSamples = samples.filter((sample) => sample.hasGalleryEntryScrollLock);
  const hiddenOverflowSamples = samples.filter((sample) => (
    sample.htmlOverflow === 'hidden' ||
    sample.bodyOverflow === 'hidden' ||
    sample.htmlOverflowY === 'hidden' ||
    sample.bodyOverflowY === 'hidden'
  ));

  return {
    samples,
    steps: immediateSteps,
    deltaY: immediateDeltaY,
    firstScrollableMs: firstScrollable?.time ?? null,
    firstPositiveScrollMs: firstPositiveScroll?.time ?? null,
    firstScrollAfterScrollableMs: firstPositiveScroll && firstScrollable
      ? Math.max(0, firstPositiveScroll.time - firstScrollable.time)
      : null,
    finalScrollY: samples.at(-1)?.scrollY ?? 0,
    lockedSampleCount: lockedSamples.length,
    hiddenOverflowSampleCount: hiddenOverflowSamples.length,
    maxScrollYBefore1000ms: Math.max(0, ...samples.filter((sample) => sample.time <= 1000).map((sample) => sample.scrollY)),
    mountedDuringImmediateScroll: {
      petitesPrix: samples.some((sample) => sample.petitesPrixMounted),
      testimonials: samples.some((sample) => sample.testimonialsMounted),
      newsletter: samples.some((sample) => sample.newsletterMounted),
      footer: samples.some((sample) => sample.footerMounted),
      productDetail: samples.some((sample) => sample.productDetailMounted),
    },
  };
};

const percentile = (values, p) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[index];
};

const summarizeRequests = (requests, segmentNames) => {
  const bySegment = {};
  for (const segment of segmentNames) {
    const segmentRequests = requests.filter((request) => request.segment === segment);
    bySegment[segment] = {
      count: segmentRequests.length,
      bytes: segmentRequests.reduce((sum, request) => sum + (request.encodedBytes || 0), 0),
      byKind: {},
      lazyJs: segmentRequests
        .filter((request) => request.kind === 'script' && request.url.includes('/_next/'))
        .map((request) => ({ url: shortUrl(request.url), bytes: request.encodedBytes || 0 })),
      images: segmentRequests
        .filter((request) => request.kind === 'image')
        .map((request) => ({ url: shortUrl(request.url), bytes: request.encodedBytes || 0 })),
    };

    for (const request of segmentRequests) {
      const current = bySegment[segment].byKind[request.kind] || { count: 0, bytes: 0 };
      current.count += 1;
      current.bytes += request.encodedBytes || 0;
      bySegment[segment].byKind[request.kind] = current;
    }
  }
  return bySegment;
};

const main = async () => {
  await fs.mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    javaScriptEnabled: true,
    bypassCSP: false,
  });
  await context.clearCookies();

  const page = await context.newPage();
  const session = await context.newCDPSession(page);
  const requests = [];
  const requestById = new Map();
  const segmentMarkers = [];
  const snapshots = [];
  const segmentNames = mode === 'immediate'
    ? [
      'navigation',
      'immediate_scroll',
      'immediate_settle',
      'final_settle',
    ]
    : [
      'navigation',
      'settled_before_scroll',
      'scroll_to_nouveautes',
      'scroll_to_petits_prix',
      'scroll_to_lower_sections',
      'final_settle',
    ];

  await session.send('Network.enable');
  await session.send('Network.setCacheDisabled', { cacheDisabled: true });
  await session.send('Network.clearBrowserCache').catch(() => null);
  await session.send('Network.clearBrowserCookies').catch(() => null);
  await session.send('Emulation.setCPUThrottlingRate', { rate: throttle });
  await session.send('Storage.clearDataForOrigin', {
    origin: new URL(targetUrl).origin,
    storageTypes: 'all',
  }).catch(() => null);

  session.on('Network.requestWillBeSent', (event) => {
    const record = {
      id: event.requestId,
      url: event.request.url,
      method: event.request.method,
      segment: segmentMarkers.at(-1)?.segment || 'navigation',
      timestamp: event.timestamp,
      wallTime: Date.now(),
      resourceType: event.type,
      status: null,
      mimeType: '',
      encodedBytes: 0,
      kind: classifyUrl(event.request.url, event.type, ''),
      failed: false,
    };
    requestById.set(event.requestId, record);
    requests.push(record);
  });
  session.on('Network.responseReceived', (event) => {
    const record = requestById.get(event.requestId);
    if (!record) return;
    record.status = event.response.status;
    record.mimeType = event.response.mimeType || '';
    record.kind = classifyUrl(record.url, record.resourceType, record.mimeType);
    const headerSize = Number(event.response.headers?.['content-length'] || event.response.headers?.['Content-Length'] || 0);
    if (headerSize > 0) record.headerContentLength = headerSize;
  });
  session.on('Network.loadingFinished', (event) => {
    const record = requestById.get(event.requestId);
    if (!record) return;
    record.encodedBytes = Math.max(Number(event.encodedDataLength || 0), Number(record.headerContentLength || 0));
    record.finishedAt = Date.now();
  });
  session.on('Network.loadingFailed', (event) => {
    const record = requestById.get(event.requestId);
    if (!record) return;
    record.failed = true;
    record.errorText = event.errorText;
  });

  await setupPageInstrumentation(page);

  let traceRaw = '';
  if (enableTrace) {
    await session.send('Tracing.start', {
      categories: TRACE_CATEGORIES.join(','),
      transferMode: 'ReturnAsStream',
      options: 'sampling-frequency=10000',
    });
  }

  await setSegment(page, 'navigation', segmentMarkers);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });

  const isLocalSecondeVie = /127\.0\.0\.1|localhost|hosted\.app|secondevie/i.test(targetUrl);
  let immediateScroll = null;

  if (mode === 'immediate') {
    await setSegment(page, 'immediate_scroll', segmentMarkers);
    immediateScroll = await runImmediateScroll(page, snapshots);
    await setSegment(page, 'immediate_settle', segmentMarkers);
    await page.waitForTimeout(1800);
    snapshots.push(await evaluateSnapshot(page, 'immediate_settle'));
  } else if (isLocalSecondeVie) {
    await waitForLocalGallery(page);
  } else {
    await page.waitForLoadState('load', { timeout: 60_000 }).catch(() => null);
    await page.waitForTimeout(2400);
  }

  if (mode !== 'immediate') {
    await setSegment(page, 'settled_before_scroll', segmentMarkers);
    snapshots.push(await evaluateSnapshot(page, 'before_scroll'));

    await setSegment(page, 'scroll_to_nouveautes', segmentMarkers);
    if (isLocalSecondeVie) {
      await wheelUntilHeading(page, 'Nouveaut', 18);
    } else {
      await fastWheel(page, 5, 720);
    }
    await page.waitForTimeout(900);
    snapshots.push(await evaluateSnapshot(page, 'during_nouveautes'));

    await setSegment(page, 'scroll_to_petits_prix', segmentMarkers);
    if (isLocalSecondeVie) {
      await wheelUntilHeading(page, 'Petits Prix', 24);
    } else {
      await fastWheel(page, 7, 780);
    }
    await page.waitForTimeout(1100);
    snapshots.push(await evaluateSnapshot(page, 'during_petits_prix'));

    await setSegment(page, 'scroll_to_lower_sections', segmentMarkers);
    await fastWheel(page, isLocalSecondeVie ? 12 : 10, 820);
    await page.waitForTimeout(1300);
    snapshots.push(await evaluateSnapshot(page, 'lower_sections'));
  }

  await setSegment(page, 'final_settle', segmentMarkers);
  await page.waitForTimeout(1200);

  if (enableTrace) {
    const tracingComplete = new Promise((resolve) => {
      session.once('Tracing.tracingComplete', resolve);
    });
    await session.send('Tracing.end');
    const completeEvent = await tracingComplete;
    traceRaw = await readTraceStream(session, completeEvent.stream);
  }

  const runtime = await page.evaluate(() => ({
    longTasks: window.__svAudit?.longTasks || [],
    frameGaps: window.__svAudit?.frameGaps || [],
    marks: window.__svAudit?.marks || [],
    resources: performance.getEntriesByType('resource').map((entry) => ({
      name: entry.name,
      initiatorType: entry.initiatorType,
      startTime: entry.startTime,
      duration: entry.duration,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,
    })),
  }));

  await browser.close();

  const tracePath = path.join(outDir, `${runId}-trace.json`);
  let traceSummary = null;
  if (traceRaw) {
    await fs.writeFile(tracePath, traceRaw);
    traceSummary = summarizeTrace(JSON.parse(traceRaw));
  }

  const imageRequests = requests.filter((request) => request.kind === 'image');
  const jsRequests = requests.filter((request) => request.kind === 'script');
  const cssRequests = requests.filter((request) => request.kind === 'stylesheet');
  const firebaseRequests = requests.filter((request) => ['firebase', 'firestore', 'auth', 'cloud-function', 'analytics'].includes(request.kind));
  const beforeScrollRequests = requests.filter((request) => ['navigation', 'settled_before_scroll'].includes(request.segment));
  const frameGaps = runtime.frameGaps || [];
  const longTasks = runtime.longTasks || [];

  const summary = {
    label,
    targetUrl,
    mode,
    runId,
    viewport: VIEWPORT,
    cpuThrottleRate: throttle,
    requestCount: requests.length,
    beforeScroll: {
      requestCount: beforeScrollRequests.length,
      jsChunks: jsRequests.filter((request) => beforeScrollRequests.includes(request) && request.url.includes('/_next/')).map((request) => shortUrl(request.url)),
      css: cssRequests.filter((request) => beforeScrollRequests.includes(request)).map((request) => shortUrl(request.url)),
      firebaseAuthFirestoreAnalytics: firebaseRequests
        .filter((request) => beforeScrollRequests.includes(request))
        .map((request) => ({ kind: request.kind, status: request.status, url: shortUrl(request.url), bytes: request.encodedBytes || 0 })),
      images: imageRequests
        .filter((request) => beforeScrollRequests.includes(request))
        .map((request) => ({ url: shortUrl(request.url), bytes: request.encodedBytes || 0 })),
    },
    bySegment: summarizeRequests(requests, segmentNames),
    longTasks: {
      count: longTasks.length,
      totalMs: Number(longTasks.reduce((sum, task) => sum + task.duration, 0).toFixed(1)),
      maxMs: Number(Math.max(0, ...longTasks.map((task) => task.duration)).toFixed(1)),
      bySegment: Object.fromEntries(segmentNames.map((segment) => {
        const tasks = longTasks.filter((task) => task.segment === segment);
        return [segment, {
          count: tasks.length,
          totalMs: Number(tasks.reduce((sum, task) => sum + task.duration, 0).toFixed(1)),
          maxMs: Number(Math.max(0, ...tasks.map((task) => task.duration)).toFixed(1)),
        }];
      })),
      top: longTasks
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 20)
        .map((task) => ({ segment: task.segment, start: Math.round(task.start), duration: Number(task.duration.toFixed(1)) })),
    },
    frameGaps: {
      count: frameGaps.length,
      maxMs: Number(Math.max(0, ...frameGaps.map((gap) => gap.gap)).toFixed(1)),
      over50: frameGaps.filter((gap) => gap.gap > 50).length,
      over100: frameGaps.filter((gap) => gap.gap > 100).length,
      p95: Number(percentile(frameGaps.map((gap) => gap.gap), 95).toFixed(1)),
      bySegment: Object.fromEntries(segmentNames.map((segment) => {
        const gaps = frameGaps.filter((gap) => gap.segment === segment);
        return [segment, {
          count: gaps.length,
          maxMs: Number(Math.max(0, ...gaps.map((gap) => gap.gap)).toFixed(1)),
          over50: gaps.filter((gap) => gap.gap > 50).length,
          over100: gaps.filter((gap) => gap.gap > 100).length,
        }];
      })),
      top: frameGaps
        .sort((a, b) => b.gap - a.gap)
        .slice(0, 20)
        .map((gap) => ({ segment: gap.segment, time: Math.round(gap.time), gap: Number(gap.gap.toFixed(1)) })),
    },
    topImages: imageRequests
      .sort((a, b) => (b.encodedBytes || 0) - (a.encodedBytes || 0))
      .slice(0, 20)
      .map((request) => ({
        segment: request.segment,
        productImage: isProductImage(request.url),
        status: request.status,
        bytes: request.encodedBytes || 0,
        url: shortUrl(request.url),
      })),
    lazyJsLoadedAfterScroll: jsRequests
      .filter((request) => !['navigation', 'settled_before_scroll'].includes(request.segment))
      .map((request) => ({
        segment: request.segment,
        status: request.status,
        bytes: request.encodedBytes || 0,
        url: shortUrl(request.url),
      })),
    snapshots,
    immediateScroll,
    traceSummary,
    tracePath: traceRaw ? tracePath : null,
    rawRequestsPath: path.join(outDir, `${runId}-requests.json`),
    summaryPath: path.join(outDir, `${runId}-summary.json`),
  };

  await fs.writeFile(summary.rawRequestsPath, JSON.stringify(requests, null, 2));
  await fs.writeFile(summary.summaryPath, JSON.stringify(summary, null, 2));

  const printable = {
    label: summary.label,
    targetUrl: summary.targetUrl,
    mode: summary.mode,
    summaryPath: summary.summaryPath,
    tracePath: summary.tracePath,
    beforeScrollRequestCount: summary.beforeScroll.requestCount,
    totalRequestCount: summary.requestCount,
    longTasks: summary.longTasks,
    frameGaps: summary.frameGaps,
    bySegment: summary.bySegment,
    topImages: summary.topImages.slice(0, 10),
    lazyJsLoadedAfterScroll: summary.lazyJsLoadedAfterScroll,
    immediateScroll: summary.immediateScroll,
    traceSummary: summary.traceSummary,
  };
  console.log(JSON.stringify(printable, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
