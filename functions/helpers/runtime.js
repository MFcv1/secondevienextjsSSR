const functions = require('firebase-functions/v1');

const PRIMARY_FUNCTIONS_REGION = 'europe-west1';
const LEGACY_FUNCTIONS_REGION = 'us-central1';
const FUNCTION_REGIONS = [LEGACY_FUNCTIONS_REGION, PRIMARY_FUNCTIONS_REGION];

function regionalFunctions() {
    return functions.region(...FUNCTION_REGIONS);
}

function getRuntimeRegion() {
    return process.env.FUNCTION_REGION || process.env.K_REGION || null;
}

function logFunctionPerf(functionName, startedAt, extra = {}) {
    const elapsedMs = Math.max(0, Date.now() - startedAt);
    console.info('function_perf', {
        functionName,
        region: getRuntimeRegion(),
        elapsedMs,
        ...extra
    });
    return elapsedMs;
}

module.exports = {
    functions,
    PRIMARY_FUNCTIONS_REGION,
    LEGACY_FUNCTIONS_REGION,
    FUNCTION_REGIONS,
    regionalFunctions,
    logFunctionPerf
};
