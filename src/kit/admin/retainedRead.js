// Memory only. A short navigation grace avoids reconnecting on every tab click.
// Hidden documents pause immediately; resuming must confirm freshness again.
export function createReadLease({ start, pause, delay = 30_000, schedule = setTimeout, cancel = clearTimeout }) {
  let timer = null;
  return {
    update(active, visible = true) {
      if (timer !== null) cancel(timer);
      timer = null;
      if (!visible) pause();
      else if (active) start();
      else timer = schedule(() => { timer = null; pause(); }, delay);
    },
    dispose() { if (timer !== null) cancel(timer); timer = null; pause(); },
  };
}

export function createRetainedRead(listen, { visibility = () => globalThis.document, ...leaseOptions } = {}) {
  let value = null, failure = null, stop = null, epoch = 0;
  const subscribers = new Set();
  const publish = () => subscribers.forEach(({ next, error }) => failure ? error(failure) : value && next(value));
  const pause = () => {
    epoch++;
    stop?.(); stop = null;
    if (value) value = { ...value, docs: value.docs, size: value.size,
      ...(value.exists ? { exists: value.exists.bind(value), data: value.data.bind(value) } : {}),
      metadata: { ...value.metadata, fromCache: true } };
    publish();
  };
  const start = () => {
    if (stop || !subscribers.size) return;
    const generation = ++epoch;
    stop = listen(snapshot => {
      if (epoch !== generation) return;
      value = snapshot; failure = null; publish();
    }, error => {
      if (epoch !== generation) return;
      value = null; failure = error; publish();
    });
  };
  const lease = createReadLease({ start, pause, ...leaseOptions });
  const refreshVisibility = () => lease.update(subscribers.size > 0, visibility()?.visibilityState !== 'hidden');
  let attached = false;
  return {
    get: () => value,
    retry() { value = null; failure = null; pause(); start(); },
    subscribe(next, error) {
      const subscriber = { next, error };
      subscribers.add(subscriber);
      if (!attached) { visibility()?.addEventListener('visibilitychange', refreshVisibility); attached = true; }
      if (failure) error(failure); else if (value) next(value);
      refreshVisibility();
      return () => { subscribers.delete(subscriber); refreshVisibility(); };
    },
    clear() {
      value = null; failure = null;
      lease.dispose();
      visibility()?.removeEventListener('visibilitychange', refreshVisibility); attached = false;
      subscribers.forEach(({ error }) => error(new Error('ADMIN_AUTHORIZATION_CHANGED')));
      subscribers.clear();
    },
  };
}
