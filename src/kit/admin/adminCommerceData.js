'use client';

import {
  listOrdersAdminV2,
  listReturnsAdminV2,
} from '../commerce/commerceV2Client';
import { loadAdminCachedData } from './adminDataCache';

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
      const [ordersOutcome, returnsOutcome] = await Promise.allSettled([
        loadAdminOrdersFirstPage({ force }),
        listReturnsAdminV2({ pageSize: 50 }),
      ]);
      return {
        ordersOutcome,
        returnsOutcome,
        orders: ordersOutcome.status === 'fulfilled'
          ? (ordersOutcome.value.orders || [])
          : [],
        returns: returnsOutcome.status === 'fulfilled'
          ? (returnsOutcome.value.returns || [])
          : [],
      };
    },
    { force }
  )
);

export const preloadAdminCommerceData = async ({ force = false } = {}) => {
  await loadAdminReturnsFirstPage({ force });
};
