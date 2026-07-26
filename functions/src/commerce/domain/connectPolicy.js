'use strict';

function connectError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
}

function validateConnectAccount(account) {
    if (
        !account ||
        typeof account.accountId !== 'string' ||
        !/^acct_[A-Za-z0-9]{8,}$/.test(account.accountId) ||
        account.active !== true ||
        account.chargesEnabled !== true ||
        account.detailsSubmitted !== true
    ) {
        throw connectError('COMMERCE_CONNECT_ACCOUNT_NOT_READY');
    }
    return {
        accountId: account.accountId,
        activeRevision: account.activeRevision,
        chargesEnabled: true,
        detailsSubmitted: true
    };
}

function pinConnectedAccount(policy, account) {
    if (policy.stripeConnectedAccountId !== account.accountId) {
        throw connectError('COMMERCE_CONNECT_POLICY_MISMATCH');
    }
    return validateConnectAccount(account);
}

function assertPinnedConnectedAccount(order, eventAccountId) {
    const pinned = order.payment?.connectedAccountId || null;
    if (pinned !== eventAccountId) throw connectError('COMMERCE_CONNECT_PIN_MISMATCH');
    return true;
}

module.exports = {
    assertPinnedConnectedAccount,
    pinConnectedAccount,
    validateConnectAccount
};
