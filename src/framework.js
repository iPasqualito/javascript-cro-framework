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

	const trackers = new ra_trackers(logger, config);
	const utils = new ra_utils(logger);
	const mobile = window.ra_mobile = utils.isMobile();

	console.log("- mobile:", mobile);
	console.log("- window.mobile:", window.ra_mobile);

	return {
		init: callback => {
			try {
				if (config.debug) logger.warn("framework: init: Framework debugging activated", config);

				if((config.devices.desktop && !mobile) || (config.devices.mobile && mobile)) {
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
		device: mobile ? "mobile" : "desktop",
		storage: new ra_storage(logger),
		observers: new ra_observers(logger),
		sendDimension: trackers.sendDimension
	}

}
