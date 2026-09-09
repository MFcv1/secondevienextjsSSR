// Share concurrent reads only. No retained data, no background refresh, no mutations.
export function createPrivateReadCoalescer({ maxEntries = 8 } = {}) {
  let owner = null;
  const pending = new Map();
  return (identity, key, load, currentIdentity) => {
    if (identity !== owner) { owner = identity; pending.clear(); }
    if (!identity) return load();
    if (pending.has(key)) return pending.get(key);
    const promise = Promise.resolve().then(load).then(result => {
      if (currentIdentity() !== identity) {
        throw Object.assign(new Error('Session modifiee.'), { code: 'functions/unauthenticated' });
      }
      return result;
    }).finally(() => { if (pending.get(key) === promise) pending.delete(key); });
    if (pending.size < maxEntries) pending.set(key, promise);
    return promise;
  };
}
