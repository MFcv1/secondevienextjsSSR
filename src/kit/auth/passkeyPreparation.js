// Share only work currently in flight. Never cache a completed/consumed challenge.
export function singleFlightPreparation(prepare) {
  let pending = null;
  return (email) => {
    if (pending?.email === email) return pending.promise;
    const entry = { email, promise: null };
    entry.promise = Promise.resolve().then(() => prepare(email)).finally(() => {
      if (pending === entry) pending = null;
    });
    pending = entry;
    return entry.promise;
  };
}
