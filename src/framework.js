import ra_logger from "./components/logger";
import ra_utils from "./components/utils";
import ra_observers from "./components/observers";
import ra_trackers from "./components/trackers";
import ra_storage from "./components/storage";

window.ra_framework = function(config) {

	const logger = new ra_logger({
		experiment: config.experiment,
		debug: (window.location.hash === "#ra-debug") ? true : config.debug
	});

	const utils = new ra_utils(logger);

	const touchSupport = utils.isTouchEnabled();
	const screenSize = utils.getScreenSize();

	const trackers = new ra_trackers(logger, config, touchSupport);

	return {
		init: callback => {
			try {
				if (config.debug) logger.warn("framework: init: Framework debugging activated", config);

				if((config.devices.desktop && screenSize !== "small") || (config.devices.mobile && touchSupport && screenSize === "small")) {
					trackers.track();
					if(typeof callback === "function") callback.call();
				} else {
					logger.warn("framework: init: device conditions not met");
				}
			}
			catch(error) {
				logger.error("framework: init: error caught", error);
			}
			finally {
				logger.log("framework: init: done");
			}
		},
		logger: logger,
		utils: utils,
		environment: {
			touchSupport: touchSupport,
			screenSize: screenSize,
			mobile: utils.isMobile()
		},
		storage: new ra_storage(logger),
		observers: new ra_observers(logger),
		sendDimension: trackers.sendDimension
	}

}
