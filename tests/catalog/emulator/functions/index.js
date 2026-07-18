const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '../../../..');
const admin = require(path.join(repositoryRoot, 'functions/node_modules/firebase-admin'));
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { recordCatalogMutation } = require(path.join(
    repositoryRoot,
    'functions/src/catalog/catalogMutationRecorder'
));

if (!admin.apps.length) admin.initializeApp();

exports.onCatalogSourceWriteEmulator = onDocumentWritten(
    {
        document: 'artifacts/{appId}/public/data/furniture/{productId}',
        region: 'europe-west1',
        retry: true
    },
    async (event) => recordCatalogMutation(
        {
            db: admin.firestore(),
            enqueue: async () => ({ scheduled: true, alreadyExists: false }),
            logger: () => {}
        },
        {
            eventId: event.id,
            appId: event.params.appId,
            productId: event.params.productId,
            before: event.data?.before?.exists ? event.data.before.data() : null,
            after: event.data?.after?.exists ? event.data.after.data() : null
        }
    )
);
