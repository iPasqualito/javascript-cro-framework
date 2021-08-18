import ra_logger from "./components/logger";
import ra_utils from "./components/utils";
import ra_observers from "./components/observers";
import ra_trackers from "./components/trackers";
import ra_storage from "./components/storage";

window.ra_framework = function(config) {

	const environment = {
		version: "4.1.1",
		development: "development" in config ? config.development : false,
		debug: window.location.hash === "#ra-debug" ? true : config.debug,
		touchSupport: null,
		screenSize: null,
		mobile: null
	};

	const logger = new ra_logger({
		experiment: config.experiment,
		debug: environment.debug
	});

	const utils = new ra_utils(logger);

	environment.touchSupport =  utils.isTouchEnabled();
	environment.screenSize = utils.getScreenSize();
	environment.mobile = utils.isMobile();

	const trackers = new ra_trackers(logger, config, environment);

	logger.info("framework environment:", environment);

	return {
		init: callback => {
			try {
				let passed = false;
				logger.info("framework: init: start", config);
				if (environment.debug) logger.warn("framework: init: Warning: debug active");
				// everything that is NOT a small screen will be treated like a desktop ( tablets too )
				if (config.devices.desktop && environment.screenSize !== "small") passed = true;
				// everything that is mobile, supports touch, and has a small screen will be treated like a mobile phone
				if (config.devices.mobile && environment.mobile && environment.touchSupport && environment.screenSize === "small") passed = true;
				// override device settings when we're in development mode.
				if (environment.development) passed = true;
				// only run if all tests are passed..
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
				// maybe it's smart to do the pageLoad event here?
				// Independent from the test code,
				// just set an event so we know we have been here
				//
				if (config.pageLoad) trackers.sendDimension("pageLoad event");
				else logger.warn("framework: init: pageLoad tracking disabled");

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

