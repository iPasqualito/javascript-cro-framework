import ra_logger from "./components/logger";
import ra_utils from "./components/utils";
import ra_observers from "./components/observers";
import ra_trackers from "./components/trackers";

window.ra_framework = function(config) {

	const logger = new ra_logger({
		experiment: config.experiment,
		debug: (window.location.hash === "#ra-debug") ? true : config.debug
	});
	const utils = new ra_utils(logger);
	const trackers = new ra_trackers(logger, {
		exp: config.experiment,
		htj: config.hotjar,
		mob: config.devices.mobile,
		pld: config.pageLoad,
		etc: config.eventTrackerElements,
		ioc: config.intersectionObserverElements
	});

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
		observers: new ra_observers(logger),
		track: trackers.sendDimension
	}

}

export default ra_framework;
