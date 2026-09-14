// Shared with the public request form and the admin proposal editor.
export const serviceGroups = [
    {
        id: 'preparation',
        title: 'Préparation',
        services: [
            {
                id: 'poncage',
                label: 'Ponçage manuel adapté',
                text: 'Ponçage en plusieurs grains pour retirer les anciennes couches sans abîmer le bois.',
                min: 45,
                max: 120,
                defaultSelected: false
            },
            {
                id: 'nettoyage',
                label: 'Nettoyage & dépoussiérage profond',
                text: 'Élimination des saletés, graisses et résidus accumulés.',
                min: 20,
                max: 45,
                defaultSelected: false
            }
        ]
    },
    {
        id: 'bois',
        title: 'Restauration du bois',
        services: [
            {
                id: 'entretien',
                label: "Application d'un produit d'entretien",
                text: 'Nourrit le bois en profondeur et ravive sa patine naturelle.',
                min: 25,
                max: 55,
                defaultSelected: false
            },
            {
                id: 'defauts',
                label: 'Rattrapage des défauts',
                text: 'Comblement des trous, fissures, impacts et rayures.',
                min: 25,
                max: 90,
                hasSeverity: true,
                defaultSelected: false
            }
        ]
    },
    {
        id: 'reparations',
        title: 'Réparations',
        services: [
            {
                id: 'renforts',
                label: 'Renforts & consolidation',
                text: 'Resserrage, collage, renforcement des assemblages fragilisés.',
                min: 40,
                max: 110,
                defaultSelected: false
            }
        ]
    },
    {
        id: 'finition',
        title: 'Finition',
        services: [
            {
                id: 'protection',
                label: 'Finition & protection',
                text: "Application d'une cire ou d'un vernis mat pour protéger durablement.",
                min: 30,
                max: 75,
                defaultSelected: false
            }
        ]
    }
];

export const quoteServices = serviceGroups.flatMap(group => group.services);
