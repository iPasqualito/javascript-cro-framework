import ra_logger from "./components/logger";
import ra_utils from "./components/utils";
import ra_observers from "./components/observers";
import ra_trackers from "./components/trackers";
import ra_storage from "./components/storage";
import ra_third_party_tools from "./components/third_party_tools";

window.ra_framework = function (config) {

	const logger = new ra_logger({
		experiment: config.experiment,
		debug: window.location.hash === "#ra-debug" ? true : config.debug
	});

	const trackers = new ra_trackers(logger, config);
	const google_analytics_version = config.eventTracker.ga_version || 3;

	return {
		init: callback => {
			try {
				logger.info("framework: init: start", {
					version: 4.8, ...config
				});
				trackers.track(google_analytics_version);
				if (config.pageLoad.active && Function(config.pageLoad.condition)) trackers.sendDimension(config.pageLoad.tag || "PageLoad Event", true, google_analytics_version);
				if (typeof callback === "function") callback.call();
			} catch (e) {
				logger.error("framework: init: error caught", e);
			} finally {
				logger.info("framework: init: done");
			}
		},
		logger,
		utils: new ra_utils(logger),
		observers: new ra_observers(logger),
		storage: new ra_storage(logger),
		third_party_tools: new ra_third_party_tools(logger, config),
		sendDimension: trackers.sendDimension
	};
};
