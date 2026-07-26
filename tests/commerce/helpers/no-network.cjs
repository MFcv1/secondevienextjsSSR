'use strict';

const { installNetworkGuard } = require('../runner/network-guard.cjs');

installNetworkGuard({ allowLocalEmulator: false });
