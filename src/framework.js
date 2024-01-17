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
	
	const trackers = new ra_trackers(logger, config);
	
	const {
		info, error
	} = logger;
	
	const google_analytics_version = config.eventTracker.ga_version || 3;

	return {
		init: callback => {
			try {
				info("framework: init: start", {
					version: 4.8, ...config
				});
				trackers.track(google_analytics_version);
				if (config.pageLoad.active && Function(config.pageLoad.condition)) trackers.sendDimension(config.pageLoad.tag || "PageLoad Event", true, google_analytics_version);
				if (typeof callback === "function") callback.call();
			} catch (e) {
				error("framework: init: error caught", e);
			} finally {
				info("framework: init: done");
			}
		},
		logger,
		utils: new ra_utils(logger),
		storage: new ra_storage(logger),
		observers: new ra_observers(logger),
		sendDimension: trackers.sendDimension
	};
};
