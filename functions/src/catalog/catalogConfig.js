const CATALOG_PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'secondevienextjsssr';
const CATALOG_ENQUEUER_SERVICE_ACCOUNT = `catalog-enqueuer@${CATALOG_PROJECT_ID}.iam.gserviceaccount.com`;
const CATALOG_BUILDER_SERVICE_ACCOUNT = `catalog-builder@${CATALOG_PROJECT_ID}.iam.gserviceaccount.com`;
const CATALOG_SNAPSHOT_BUCKET = process.env.CATALOG_SNAPSHOT_BUCKET || 'secondevienextjsssr-catalog-europe-west4';
const CATALOG_REVALIDATION_URL = process.env.CATALOG_REVALIDATION_URL
    || 'https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app/api/revalidate-catalog';
const CATALOG_MEDIA_GC_COMMIT = process.env.CATALOG_MEDIA_GC_COMMIT || 'false';

module.exports = {
    CATALOG_BUILDER_SERVICE_ACCOUNT,
    CATALOG_ENQUEUER_SERVICE_ACCOUNT,
    CATALOG_MEDIA_GC_COMMIT,
    CATALOG_REVALIDATION_URL,
    CATALOG_SNAPSHOT_BUCKET
};
