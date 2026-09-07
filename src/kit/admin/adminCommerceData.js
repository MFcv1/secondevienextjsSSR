'use client';

import {
  listCustomerReturnRequestsAdminV2,
  listOrdersAdminV2,
  listReturnsAdminV2,
} from '../commerce/commerceV2Client';
import { getAdminCachedData, loadAdminCachedData } from './adminDataCache';

export const ADMIN_ORDERS_FIRST_PAGE_KEY = 'admin-orders:first-page';
export const ADMIN_RETURNS_FIRST_PAGE_KEY = 'admin-returns:first-page';

export const loadAdminOrdersFirstPage = ({ force = false } = {}) => (
  loadAdminCachedData(
    ADMIN_ORDERS_FIRST_PAGE_KEY,
    () => listOrdersAdminV2({ pageSize: 50 }),
    { force }
  )
);

export const loadAdminReturnsFirstPage = ({ force = false } = {}) => (
  loadAdminCachedData(
    ADMIN_RETURNS_FIRST_PAGE_KEY,
    async () => {
      const previous = getAdminCachedData(ADMIN_RETURNS_FIRST_PAGE_KEY, { allowStale: true });
      const [ordersOutcome, returnsOutcome, requestsOutcome] = await Promise.allSettled([
        loadAdminOrdersFirstPage({ force }),
        listReturnsAdminV2({ pageSize: 50 }),
        listCustomerReturnRequestsAdminV2({ pageSize: 50 }),
      ]);
      const authorizationFailure = [ordersOutcome, returnsOutcome, requestsOutcome].find(
        (outcome) => outcome.status === 'rejected' && ['permission-denied', 'functions/permission-denied', 'unauthenticated', 'functions/unauthenticated', 'admin/authorization-changed'].includes(outcome.reason?.code)
      );
      if (authorizationFailure) throw authorizationFailure.reason;
      return {
        ordersOutcome,
        returnsOutcome,
        requestsOutcome,
        orders: ordersOutcome.status === 'fulfilled'
          ? (ordersOutcome.value.orders || [])
          : (previous?.orders || []),
        returns: returnsOutcome.status === 'fulfilled'
          ? (returnsOutcome.value.returns || [])
          : (previous?.returns || []),
        requests: requestsOutcome.status === 'fulfilled'
          ? (requestsOutcome.value.requests || [])
          : (previous?.requests || []),
      };
    },
    { force }
  )
);

export const preloadAdminCommerceData = async ({ force = false } = {}) => {
  await loadAdminReturnsFirstPage({ force });
};
