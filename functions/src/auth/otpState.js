'use strict';

// Mail delivery and Auth calls run outside Firestore. Their late responses must
// never change a challenge that a newer OTP request has already replaced.
async function updateOtpStateIfCurrent(db, ref, expected, patch) {
    return db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) return false;
        const state = snapshot.data();
        if (!Object.entries(expected).every(([field, value]) => state[field] === value)) return false;
        transaction.update(ref, patch);
        return true;
    });
}

module.exports = { updateOtpStateIfCurrent };
