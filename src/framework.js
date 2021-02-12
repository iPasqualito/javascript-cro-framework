import ra_logger from "./components/logger";
import ra_utils from "./components/utils";
import ra_observers from "./components/observers";

const ra_framework = function(config) {

	console.log("framework running, config:", config);

	const logger = new ra_logger({
		test: config.abtest,
		debug: (window.location.hash === "#ra-debug") ? true : config.debug
	});
	const utils = new ra_utils(logger);
	// todo this should be added to git

	return {
		init: (callback) => {
			if (config.debug) logger.warn("Init: debugger switched on in config, consider switching it off on goLive.");
			logger.info("Init: framework start");
			try {
				if(typeof callback === "function") callback.call();
			}
			catch(e) {
				logger.error("Init: fail", e);
			}
			finally {
				logger.log("init: all ready");
			}
		},
		logger: logger,
		utils: utils
	}

}

export default ra_framework;
