import { collection, doc, documentId, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { subscribeAdminCacheGeneration } from './adminDataCache';
import { createRetainedRead } from './retainedRead';
import { CRITICAL_DOCUMENT_IDS } from './adminDashboardProjection';

export const dashboardKpis = createRetainedRead((next, error) => onSnapshot(
  query(collection(db, 'admin_dashboard'), where(documentId(), 'in', CRITICAL_DOCUMENT_IDS)),
  { includeMetadataChanges: true }, next, error
));
export const dashboardOrders = createRetainedRead((next, error) => onSnapshot(
  query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5)),
  { includeMetadataChanges: true }, next, error
));
export const dashboardInsights = createRetainedRead((next, error) => onSnapshot(
  doc(db, 'admin_dashboard', 'insights'), { includeMetadataChanges: true }, next, error
));
subscribeAdminCacheGeneration(() => { dashboardKpis.clear(); dashboardOrders.clear(); dashboardInsights.clear(); });
