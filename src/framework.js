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

	const environment = {
		touchSupport:  utils.isTouchEnabled(),
		screenSize: utils.getScreenSize(),
		mobile: utils.isMobile()
	};

	const trackers = new ra_trackers(logger, config, environment);

	return {
		init: callback => {
			try {
				let passed = false;
				logger.info("framework: init: start", config);
				if (config.debug) logger.warn("framework: init: Warning: debug active");
				// everything that is NOT a small screen will be treated like a desktop ( tablets too )
				if (config.devices.desktop && environment.screenSize !== "small") passed = true;
				// everything that is mobile, supports touch, and has a small screen will be treated like a mobile phone ( tablets too )
			    if (config.devices.mobile && environment.mobile && environment.touchSupport && environment.screenSize === "small") passed = true;

			    if( passed ) {
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
		environment: environment,
		storage: new ra_storage(logger),
		observers: new ra_observers(logger),
		sendDimension: trackers.sendDimension
	}

}
