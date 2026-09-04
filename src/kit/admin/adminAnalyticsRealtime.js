import { useSyncExternalStore } from 'react';
import { collection, documentId, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { createAnalyticsChannel, validateAnalyticsSnapshot } from './adminAnalyticsRealtimeStore';

export const ANALYTICS_REALTIME_ENABLED = process.env.NEXT_PUBLIC_ADMIN_ANALYTICS_REALTIME === 'true';
export const analyticsChannel = createAnalyticsChannel((next, error) => onSnapshot(
    query(collection(db, 'admin_analytics_realtime'), where(documentId(), 'in', ['recent', 'history'])),
    { includeMetadataChanges: true }, next, error
), validateAnalyticsSnapshot);
export function useAnalyticsRealtime() {
    return useSyncExternalStore(analyticsChannel.subscribe, analyticsChannel.getSnapshot, analyticsChannel.getServerSnapshot);
}
