// Le sandbox utilise des paiements Stripe test, mais le parcours fonctionnel
// reste toujours disponible. Les autorisations et l'etat metier sont controles
// par les Functions; un flag de build ne doit plus masquer le checkout.
export const COMMERCE_V2_UI_ENABLED = true;
