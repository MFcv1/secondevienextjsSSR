'use strict';
function pubsubCloudEvent(payload, context) {
    if (payload?.data?.message) return payload;
    if (!context || typeof payload?.data !== 'string' || !context.eventId || !context.timestamp) throw Error('PUBSUB_EVENT_FORMAT_INVALID');
    return {
        specversion: '1.0', id: context.eventId, time: context.timestamp,
        type: 'google.cloud.pubsub.topic.v1.messagePublished',
        source: `//pubsub.googleapis.com/${context.resource?.name || context.resource || ''}`,
        data: { message: { data: payload.data, attributes: payload.attributes || {},
            messageId: context.eventId, publishTime: context.timestamp } }
    };
}
module.exports = { pubsubCloudEvent };
