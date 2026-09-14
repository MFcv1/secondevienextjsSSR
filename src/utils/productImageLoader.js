// One admission queue for gallery, detail and zoom. Native visible <img> loads
// remain browser-owned; speculative work leaves a slot for an explicit action.
const entries = new Map();
const queue = [];
const decodeQueue = [];
let active = 0;
let decoding = false;
let pauseUntil = 0;
let resumeTimer = 0;
let sequence = 0;
const rank = { low: 0, auto: 1, high: 2 };
const compact = () => !window.matchMedia?.('(min-width: 1024px)').matches;
const limit = () => compact() ? 2 : 3;
const cacheLimit = () => compact() ? 32 : 64;

// Readiness hint only: the mounted image still confirms its own decoded paint.
export const getLoadedProductImage = (src) => {
  const entry = entries.get(`${src}||`);
  return entry?.state === 'loaded' && entry.image?.naturalWidth ? entry.image : null;
};

const prune = () => {
  for (const [key, entry] of entries) {
    if (entries.size <= cacheLimit()) break;
    if (entry.state === 'loaded' && !entry.decoding && !entry.retained) entries.delete(key);
  }
};

const updateDemand = (entry) => {
  const demands = [...entry.owners.values()];
  entry.priority = demands.reduce((best, demand) => rank[demand.priority] > rank[best] ? demand.priority : best, 'low');
  entry.order = Math.min(...demands.map((demand) => demand.order));
  entry.retained = demands.some((demand) => demand.retain);
  if (entry.image && entry.image.fetchPriority !== entry.priority) entry.image.fetchPriority = entry.priority;
};

const pumpDecode = () => {
  if (decoding || !decodeQueue.length) return;
  decodeQueue.sort((a, b) => rank[b.entry.priority] - rank[a.entry.priority]);
  if (decodeQueue[0].entry.priority !== 'high' && Date.now() < pauseUntil) return;
  const { entry, resolve } = decodeQueue.shift();
  if (!entry.decodeOwners.size) {
    resolve(null);
    pumpDecode();
    return;
  }
  decoding = true;
  entry.decoding = true;
  // Do not retain a failed decode forever. Callers keep the previous image.
  let timer;
  Promise.race([
    Promise.resolve().then(() => entry.image.decode?.()),
    new Promise((_, reject) => { timer = window.setTimeout(() => reject(new Error('decode timeout')), 5000); }),
  ]).then(
    () => resolve(entry.image),
    () => resolve(null),
  ).finally(() => {
    window.clearTimeout(timer);
    decoding = false;
    entry.decoding = false;
    prune();
    pumpDecode();
  });
};

const pump = () => {
  queue.sort((a, b) => rank[b.priority] - rank[a.priority] || a.order - b.order || a.sequence - b.sequence);
  while (queue.length) {
    const entry = queue[0];
    const urgent = entry.priority === 'high';
    if (active >= limit() + (urgent ? 1 : 0)) break;
    queue.shift();
    active += 1;
    entry.state = 'loading';
    const image = new Image();
    entry.image = image;
    image.decoding = 'async';
    image.fetchPriority = entry.priority;
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      active -= 1;
      entry.state = ok ? 'loaded' : 'failed';
      if (!ok) {
        if (entries.get(entry.key) === entry) entries.delete(entry.key);
        image.removeAttribute('src');
      }
      entry.resolve(ok ? image : null);
      prune();
      pump();
    };
    const timer = window.setTimeout(() => finish(false), 20000);
    image.onload = () => finish(image.naturalWidth > 0);
    image.onerror = () => finish(false);
    if (entry.srcSet) {
      if (entry.sizes) image.sizes = entry.sizes;
      image.srcset = entry.srcSet;
    }
    image.src = entry.src;
  }
};

export const pauseSpeculativeProductImages = (duration = 180) => {
  if (typeof window === 'undefined') return;
  pauseUntil = Date.now() + duration;
  window.clearTimeout(resumeTimer);
  resumeTimer = window.setTimeout(pumpDecode, duration);
};

const releaseImageOwner = (owner, keep = new Set()) => {
  for (const entry of entries.values()) {
    if (keep.has(entry.key) || !entry.owners.has(owner)) continue;
    entry.owners.delete(owner);
    entry.decodeOwners.delete(owner);
    updateDemand(entry);
  }
  for (let index = queue.length - 1; index >= 0; index -= 1) {
    const entry = queue[index];
    if (entry.owners.size) continue;
    queue.splice(index, 1);
    if (entries.get(entry.key) === entry) entries.delete(entry.key);
    entry.resolve(null);
  }
  prune();
};

export const clearQueuedImageLoads = (owner) => releaseImageOwner(owner);

// Replace this surface's demand without cancelling useful queued downloads.
// Batch admission lets every visible primary precede nearby/album resources.
export const syncImageLoadPlan = (owner, requests) => {
  const desired = new Map(requests.filter(({ src }) => src).map((request) => [`${request.src}||`, request]));
  releaseImageOwner(owner, new Set(desired.keys()));
  let retained = 0;
  for (const request of desired.values()) {
    preloadImage(request.src, { ...request, owner, decode: false, deferStart: true,
      retain: Boolean(request.retain && retained++ < cacheLimit() / 2),
    });
  }
  pump();
};

export const preloadImage = (src, options = {}) => {
  if (!src || typeof window === 'undefined') return Promise.resolve(null);
  // sizes has no effect without srcset; use the same entry for every caller.
  const key = `${src}|${options.srcSet || ''}|${options.srcSet ? options.sizes || '' : ''}`;
  let entry = entries.get(key);
  const priority = options.priority || 'auto';
  if (!entry) {
    entry = { key, src, srcSet: options.srcSet, sizes: options.sizes, priority,
      state: 'queued', owners: new Map(), decodeOwners: new Set(), sequence: sequence++, image: null, decoded: null };
    entry.promise = new Promise((resolve) => { entry.resolve = resolve; });
    entries.set(key, entry);
    queue.push(entry);
    if (queue.length > 48) {
      const lowIndex = queue.findIndex((candidate) => candidate.priority === 'low');
      const [dropped] = queue.splice(Math.max(0, lowIndex), 1);
      entries.delete(dropped.key);
      dropped.resolve(null);
    }
  } else {
    // LRU and promotion also apply to a download that is already in flight.
    entries.delete(key);
    entries.set(key, entry);
  }
  entry.owners.set(options.owner || 'interaction', {
    priority, order: options.order ?? Infinity, retain: Boolean(options.retain),
  });
  updateDemand(entry);
  if (!options.deferStart) pump();
  if (options.decode === false) return entry.promise;
  const decodeOwner = options.owner || 'interaction';
  entry.decodeOwners.add(decodeOwner);
  return entry.promise.then((image) => {
    if (!image || options.signal?.aborted || !entry.decodeOwners.has(decodeOwner)) return null;
    if (!entry.decoded) {
      entry.decoded = new Promise((resolve) => {
        decodeQueue.push({ entry, resolve });
        if (decodeQueue.length > 16) {
          const lowIndex = decodeQueue.findIndex((task) => task.entry.priority !== 'high');
          decodeQueue.splice(Math.max(0, lowIndex), 1)[0].resolve(null);
        }
        pumpDecode();
      }).then((result) => {
        if (!result) entry.decoded = null;
        return result;
      });
    }
    return entry.decoded;
  });
};
