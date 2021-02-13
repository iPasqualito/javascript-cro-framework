import ra_logger from "./components/logger";
import ra_utils from "./components/utils";
import ra_observers from "./components/observers";
import ra_trackers from "./components/trackers";

export let globals; // for framework use
export let logger;

window.ra_framework = function(config) {

	globals = {...config};

	console.log('globals', globals);

	logger = new ra_logger({
		experiment: globals.experiment,
		debug: (window.location.hash === "#ra-debug") ? true : globals.debug
	});

	const utils = new ra_utils(); // for exposure to test script
	const trackers = new ra_trackers();

	return {
		init: callback => {
			try {

				logger.info("init: start", globals);

				if (globals.debug) logger.warn("Init: debugger switched on in config, consider switching it off on goLive.");

				const isMobile = utils.isMobile();

				if((globals.devices.desktop && !isMobile) || (globals.devices.mobile && isMobile)) {
					trackers.track();
					if(typeof callback === "function") callback.call();
				} else {
					logger.error("Init: device conditions not met");
				}

			}
			catch(e) {
				logger.error("Init: fail", e);
			}
			finally {
				logger.log("init: done");
			}
		},
		logger: logger,
		utils: utils,
		observers: new ra_observers(),
		tracker: trackers.sendDimension
	}

}
