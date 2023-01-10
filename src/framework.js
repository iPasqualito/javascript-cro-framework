import ra_logger from "./components/logger";
import ra_utils from "./components/utils";
import ra_observers from "./components/observers";
import ra_trackers from "./components/trackers";
import ra_storage from "./components/storage";

window.ra_framework = function (config) {

	const logger = new ra_logger({
		experiment: config.experiment,
		debug: window.location.hash === "#ra-debug" ? true : config.debug
	});

	const utils = new ra_utils(logger);

	const environment = {
		version: "4.5.1",
		touchSupport: utils.isTouchEnabled(),
		screenSize: utils.getScreenSize(),
		mobile: utils.isMobile()
	};

	const trackers = new ra_trackers(logger, config, environment);

	return {
		init: callback => {
			try {
				logger.info("framework: init: start", {config, environment});
				trackers.track();
				if (config.pageLoad.track && Function(config.pageLoad.condition)) trackers.sendDimension(config.pageLoad.tag || "pageLoad event");
				if (typeof callback === "function") callback.call();
			} catch (error) {
				logger.error("framework: init: error caught", error);
			} finally {
				logger.log("framework: init: done");
			}
		},
		logger: logger,
		utils: utils,
		environment: environment,
		storage: new ra_storage(logger),
		observers: new ra_observers(logger),
		sendDimension: trackers.sendDimension
	};

};

