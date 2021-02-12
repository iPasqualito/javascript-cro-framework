import ra_logger from "./components/logger";
import ra_utils from "./components/utils";
import ra_observers from "./components/observers";
import ra_trackers from "./components/trackers";

const ra_framework = function(config) {

	console.log("framework running, config:", config);

	const logger = new ra_logger({
		experiment: config.experiment,
		debug: (window.location.hash === "#ra-debug") ? true : config.debug
	});
	const utils = new ra_utils(logger);
	const trackers = new ra_trackers(logger, {
		experiment: config.experiment,
		hotjar: config.hotjar,
		pageLoad: config.pageLoad,
		etc: config.eventTrackerElements,
		ioc: config.intersectionObserverElements
	});

	return {
		init: callback => {
			try {

				if (config.debug) logger.warn("Init: debugger switched on in config, consider switching it off on goLive.");

				logger.info("Init: framework start");

				if(config.devices.desktop || (config.devices.mobile && utils.isMobile())) {
					trackers.track();
					if(typeof callback === "function") callback.call();
				} else {
					logger.error("device conditions not met");
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
		utils: utils
	}

}

export default ra_framework;
