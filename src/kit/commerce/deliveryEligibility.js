// Mirrors the active standard checkout policy: local delivery is limited to 13.
// The server still validates the zone and authoritative delivery price.
export function deliveryUnavailableReason(modeId, postalCode) {
    if (modeId !== 'idf') return '';
    const postal = String(postalCode || '').trim();
    if (!/^\d{5}$/.test(postal)) return 'Renseignez votre code postal pour vérifier la livraison locale.';
    return postal.startsWith('13') ? '' : 'Disponible uniquement dans les Bouches-du-Rhône (13).';
}
