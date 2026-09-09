// Cache validated immutable releases only. Pointer reads remain outside this cache.
export function createImmutableReleaseCache({ maxEntries = 3, maxBytes = 24 * 1024 * 1024 } = {}) {
  const entries = new Map();
  let bytes = 0;
  return async (pointer, load) => {
    // Include every pointer field: a changed contract or digest must be validated again.
    const key = JSON.stringify(pointer);
    const existing = entries.get(key);
    if (existing) {
      entries.delete(key);
      entries.set(key, existing);
      return existing.promise;
    }
    const entry = { bytes: 0, promise: null };
    const remove = (id, value) => { entries.delete(id); bytes -= value.bytes; };
    entry.promise = Promise.resolve().then(() => load(pointer)).then(snapshot => {
      if (entries.get(key) !== entry) return snapshot;
      entry.bytes = Buffer.byteLength(JSON.stringify(snapshot));
      bytes += entry.bytes;
      while (entries.size > maxEntries || bytes > maxBytes) {
        const [id, value] = entries.entries().next().value;
        remove(id, value);
      }
      return snapshot;
    }).catch(error => {
      if (entries.get(key) === entry) remove(key, entry);
      throw error;
    });
    entries.set(key, entry);
    // Bound pending loads too; an evicted promise cannot repopulate the cache.
    while (entries.size > maxEntries) {
      const [id, value] = entries.entries().next().value;
      remove(id, value);
    }
    return entry.promise;
  };
}
