'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { pubsubCloudEvent } = require('../functions/helpers/gcloudPubsubEvent.cjs');
const { onMessagePublished } = require('node:module').createRequire(require('node:path').resolve(__dirname, '../functions/package.json'))('firebase-functions/v2/pubsub');
test('both gcloud signatures reach the real Pub/Sub SDK without malformed message errors', async () => {
    const data = Buffer.from(JSON.stringify({ value: 42 })).toString('base64');
    const native = { data: { message: { data, messageId: 'msg1', publishTime: '2026-09-10T00:00:00Z' } } };
    const handler = onMessagePublished('test-topic', event => event.data.message.json);
    assert.deepEqual(await handler(pubsubCloudEvent(native)), { value: 42 });
    assert.deepEqual(await handler(pubsubCloudEvent({ data }, { eventId: 'msg1', timestamp: '2026-09-10T00:00:00Z', resource: { name: 'projects/demo/topics/test-topic' } })), { value: 42 });
    assert.throws(() => pubsubCloudEvent({ data }), /FORMAT_INVALID/);
});
test('billing export retains its deployable endpoint metadata', () => {
    const { captureProjectCostsGen2 } = require('../functions/src/billing/projectCosts');
    assert.equal(captureProjectCostsGen2.__endpoint.eventTrigger.eventType, 'google.cloud.pubsub.topic.v1.messagePublished');
    assert.equal(captureProjectCostsGen2.__endpoint.eventTrigger.retry, true);
});
