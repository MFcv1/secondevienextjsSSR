// One bounded pass per mounted, authorized back-office. Never polls or keeps
// servers warm. A foreground navigation can overtake queued background jobs.
export function createAdminPreloadQueue({ jobs, schedule = setTimeout, cancel = clearTimeout, delay = 1000 }) {
  let pending = [...jobs];
  let timer = null;
  let running = false;
  let paused = true;
  let disposed = false;
  let controller = null;
  const attempted = new Set();
  const enqueue = () => {
    if (disposed || paused || running || timer !== null || !pending.length) return;
    timer = schedule(async () => {
      timer = null;
      if (disposed || paused) return;
      const job = pending.shift();
      attempted.add(job.id);
      running = true;
      controller = new AbortController();
      try { await job.run(controller.signal); } catch { /* The view owns errors and retry. */ }
      finally { running = false; controller = null; enqueue(); }
    }, delay);
  };
  return {
    resume() { if (disposed) return; paused = false; enqueue(); },
    pause() {
      paused = true;
      if (timer !== null) cancel(timer);
      timer = null;
      controller?.abort();
    },
    prioritize(id) {
      const index = pending.findIndex(job => job.id === id);
      if (index >= 0 && !attempted.has(id)) pending.unshift(...pending.splice(index, 1));
      // Give the real click/render a quiet interval before the next job.
      if (timer !== null) cancel(timer);
      timer = null;
      enqueue();
    },
    dispose() { disposed = true; this.pause(); pending = []; },
  };
}

// Borrow the existing Data channels briefly; never mount an invisible Data view
// or leave its live listeners running in the background.
export async function preloadAdminChannels(channels, { signal, keepActive, timeoutMs = 5000 }) {
  const stops = [];
  let timer;
  let finish;
  const done = new Promise(resolve => { finish = resolve; });
  const check = () => {
    if (channels.every(channel => ['ready', 'error'].includes(channel.getSnapshot().status))) finish();
  };
  try {
    if (signal.aborted) return;
    signal.addEventListener('abort', finish, { once: true });
    timer = setTimeout(finish, timeoutMs);
    for (const channel of channels) {
      stops.push(channel.subscribe(check));
      channel.start();
    }
    check();
    await done;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', finish);
    stops.forEach(stop => stop());
    if (!keepActive()) channels.forEach(channel => channel.pause());
  }
}
