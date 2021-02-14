import ra_logger from "./components/logger";
import ra_utils from "./components/utils";
import ra_observers from "./components/observers";
import ra_trackers from "./components/trackers";
import ra_storage from "./components/storage";

window.ra_framework = function(config) {

	// todo: make logger and config 'globally' available
	// so we don't have to pass them as parameters
	// logger should be a singleton

	const logger = new ra_logger({
		experiment: config.experiment,
		debug: (window.location.hash === "#ra-debug") ? true : config.debug
	});

	const trackers = new ra_trackers(logger, config);
	const utils = new ra_utils(logger);

	return {
		init: callback => {
			try {

				logger.info("init: start", config);

				if (config.debug) logger.warn("Init: debugger switched on in config, consider switching it off on goLive.");

				const isMobile = utils.isMobile();

				if((config.devices.desktop && !isMobile) || (config.devices.mobile && isMobile)) {
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
		storage: new ra_storage(logger),
		observers: new ra_observers(logger),
		sendDimension: trackers.sendDimension
	}

}
