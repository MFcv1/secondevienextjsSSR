export function canRequestSandboxRestock(item, projectId) {
    return projectId === 'secondevienextjsssr' && item?.status === 'published' && item.stock === 0;
}

export function sandboxRestockError(error) {
    const reason = error?.details?.reason || '';
    const messages = {
        COMMERCE_SANDBOX_RESTOCK_RESERVED: 'Une réservation est encore en cours. Le moteur de paiement doit la terminer ou libérer le stock ; réessayez ensuite.',
        COMMERCE_SANDBOX_RESTOCK_NO_SALE: 'Aucune vente confirmée correspondant à ce stock n’a été retrouvée. La remise automatique est bloquée.',
        COMMERCE_SANDBOX_RESTOCK_RETURN_PENDING: 'Un remboursement ou un retour concerne cette vente. Utilisez le parcours Retours pour remettre ce meuble en stock.',
        COMMERCE_SANDBOX_RESTOCK_ENVIRONMENT: 'Cette action est réservée au sandbox avec un compte Stripe test et le commerce ouvert.',
        COMMERCE_SANDBOX_RESTOCK_NOT_EMPTY: 'Le meuble n’est plus publié avec un stock à zéro. Fermez cette fenêtre et vérifiez la ligne.',
        COMMERCE_SANDBOX_RESTOCK_STALE: 'Le stock a changé depuis l’ouverture. Fermez cette fenêtre et recommencez depuis la ligne actualisée.',
        COMMERCE_SANDBOX_RESTOCK_INCOMPLETE: 'L’historique ne permet pas une vérification complète. Aucune remise en stock n’a été effectuée.',
    };
    return messages[reason] || 'La remise en stock n’a pas pu être confirmée. Vous pouvez réessayer : la même opération ne sera pas appliquée deux fois.';
}
