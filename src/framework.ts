import { ra_logger } from './components/logger';
import ra_utils from "./components/utils";
import { ra_observers } from "./components/observers";
import { ra_trackers } from "./components/trackers";
import { ra_storage } from "./components/storage";
import { CustomWindow } from './helpers/globalWindow';

declare let window: CustomWindow;

window.ra_framework = function(config) {

	const logger = new (ra_logger({
		experiment: config.experiment,
		debug: (window.location.hash === "#ra-debug") ? true : config.debug
	}) as any);

	const trackers = new (ra_trackers(logger, config) as any);
	const utils = new (ra_utils(logger) as any);
	const mobile = window.ra_mobile = utils.isMobile();

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
		storage: new (ra_storage(logger) as any),
		observers: new (ra_observers(logger) as any),
		sendDimension: trackers.sendDimension
	}

}
