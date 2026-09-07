const FALLBACK_ORDER = 999999;

export function planInventoryReorder(items, movedId, field) {
  if (!['nouveautesOrder', 'petitsPrixOrder'].includes(field)) throw new Error('Ordre invalide');
  const index = items.findIndex(item => item.id === movedId);
  if (index < 0) return [];
  const rank = item => Number.isFinite(item?.[field]) ? item[field] : FALLBACK_ORDER;
  const previous = index > 0 ? rank(items[index - 1]) : null;
  const next = index < items.length - 1 ? rank(items[index + 1]) : null;
  const value = previous === null ? (next ?? 0) - 1
    : next === null ? previous + 1 : previous + (next - previous) / 2;
  if (Number.isFinite(value) && (previous === null || value > previous) && (next === null || value < next)) {
    return [{ item: items[index], value }];
  }
  // Equal legacy ranks require normalization. Keep it atomic: never split a
  // reordering across independent commits that could leave half an order.
  const changes = items.flatMap((item, position) => item[field] === position ? [] : [{ item, value: position }]);
  if (changes.length > 400) throw new Error('Ce reclassement nécessite de normaliser plus de 400 pièces. Aucun ordre n’a été modifié.');
  return changes;
}
