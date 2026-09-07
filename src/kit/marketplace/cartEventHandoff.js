// Preserve every action while the lazily loaded cart installs its listeners.
export function createCartEventHandoff(deliver) {
  let ready = false;
  let pending = [];
  return {
    capture(event) {
      if (ready) return false;
      pending.push(event);
      return true;
    },
    ready() {
      if (ready) return;
      ready = true;
      const events = pending;
      pending = [];
      events.forEach(deliver);
    },
  };
}
