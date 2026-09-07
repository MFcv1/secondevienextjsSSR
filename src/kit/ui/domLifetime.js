// One owner for DOM listeners, delayed work and observers of an interaction island.
export function createDomLifetime(runtime = window) {
  const controller = new AbortController();
  const timers = new Set();
  const frames = new Set();
  const observers = new Set();
  let disposed = false;
  return {
    get disposed() { return disposed; },
    get signal() { return controller.signal; },
    later(callback, delay) {
      if (disposed) return undefined;
      const id = runtime.setTimeout(() => {
        timers.delete(id);
        if (!disposed) callback();
      }, delay);
      timers.add(id);
      return id;
    },
    clearTimer(id) {
      runtime.clearTimeout(id);
      timers.delete(id);
    },
    frame(callback) {
      if (disposed) return undefined;
      const id = runtime.requestAnimationFrame(time => {
        frames.delete(id);
        if (!disposed) callback(time);
      });
      frames.add(id);
      return id;
    },
    observe(observer, target) {
      if (disposed) { observer.disconnect(); return; }
      observers.add(observer);
      observer.observe(target);
    },
    dispose() {
      disposed = true;
      controller.abort();
      timers.forEach(id => runtime.clearTimeout(id));
      frames.forEach(id => runtime.cancelAnimationFrame(id));
      observers.forEach(observer => observer.disconnect());
      timers.clear();
      frames.clear();
      observers.clear();
    },
  };
}
