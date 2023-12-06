import ra_logger from "./components/logger";
import ra_utils from "./components/utils";
import ra_observers from "./components/observers";
import ra_trackers from "./components/trackers";
import ra_storage from "./components/storage";

window.ra_framework = function (config) {
	
	const {
		id: experimentId,
		name: experimentName,
		variation: {
			id: variationId,
			name: variationName
		}
	} = config.experiment;
	
	const logger = new ra_logger({
		experiment: config.experiment,
		debug: window.location.hash === "#ra-debug" ? true : config.debug
	});
	
	const {
		log, info, error
	} = logger;
	
	const google_analytics_version = config.eventTracker.ga_version || 3;
	
	const trackers = new ra_trackers(logger, config);
	
	const objectLoaded = function (obj, timeout = 10000) {
		return new Promise((resolve, reject) => {
			const now = performance.now(), testObject = async (o, t) => {
				while (!window.hasOwnProperty(o)) {
					if (performance.now() - now > t) throw new Error("timeout reached");
					await new Promise(r => setTimeout(r, 100)); //100 should be a small enough gap
				}
				return window[o];
			};
			testObject(obj, timeout).then(resolve).catch(error => {
				reject(`objectLoaded: ${error}`);
			});
		});
	};

	return {
		init: callback => {
			try {
				info("framework: init: start", config);
				trackers.track(google_analytics_version);
				if (config.pageLoad.active && Function(config.pageLoad.condition)) trackers.sendDimension(config.pageLoad.tag || "PageLoad Event", true, google_analytics_version);
				if (typeof callback === "function") callback.call();
			} catch (e) {
				error("framework: init: error caught", e);
			} finally {
				log("framework: init: done");
			}
		},
		logger: logger,
		utils: new ra_utils(logger),
		storage: new ra_storage(logger),
		observers: new ra_observers(logger),
		sendDimension: trackers.sendDimension,
		third_party_tools: {
			triggerHotjar: () => {
				try {
					info("third_party_tools: triggerHotjar", experimentId + variationId);
					window.hj = window.hj || (() => (window.hj.q = window.hj.q || []).push(arguments));
					window.hj("trigger", experimentId + variationId);
				} catch (e) {
					error("third_party_tools: triggerHotjar error", e);
				}
			},
			triggerMouseFlow: () => {
				try {
					info("third_party_tools: triggerMouseFlow", experimentId + variationId);
					(window._mfq = window._mfq || []).push(["setVariable", experimentId + variationId, variationName]);
				} catch (e) {
					error("third_party_tools: triggerMouseFlow error", e);
				}
			},
			triggerClarity: (timeout = 5000) => {
				try {
					objectLoaded("clarity", timeout).then(_clarity => {
						if (typeof _clarity !== "function") throw new Error("Clarity is not a function");
						info("third_party_tools: triggerClarity", {
							experiment: `${experimentId} - ${experimentName}`,
							variation: `${variationId}: ${variationName}`
						});
						_clarity("set", "Experiment", `${experimentId} - ${experimentName}`);
						_clarity("set", "Variation", `${variationId}: ${variationName}`);
					}).catch(e => {
						error("third_party_tools: triggerClarity error", e);
					});
				} catch (e) {
					error("third_party_tools: triggerClarity error", e);
				}
			}
		}
	};

};
