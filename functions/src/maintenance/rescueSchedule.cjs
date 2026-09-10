'use strict';
function rescueSchedule(legacy, _candidate, env = process.env) {
    if (env.ACTIVITY_MAINTENANCE_SLOW_RESCUE !== 'true') return legacy;
    throw new Error('MAINTENANCE_SLOW_RESCUE_RETIRED_USE_QUALIFIED_CUTOVER');
}
module.exports = { rescueSchedule };
