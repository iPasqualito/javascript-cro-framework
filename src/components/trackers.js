import ra_observers from "./observers";

const ra_trackers = function (logger, config) {

	const observers = new ra_observers(logger);

	const sendDimension = function (eventAction, eventNonInteraction = true) {
		logger.info("sendDimension", eventAction);
		(window.dataLayer = window.dataLayer || []).push({
			event: eventNonInteraction ? `trackEventNI` : `trackEvent`, // if eventNonInteraction is not set default to trackEventNI
			eventCategory: `${config.experiment.id}: ${config.experiment.name}`,
			eventAction: eventAction,
			eventLabel: `${config.experiment.variation.id}: ${config.experiment.variation.name}`,
			eventNonInteraction: eventNonInteraction // if not sent default to true
		}); //edgy!
	};

	const triggerHotjar = function () {
		logger.info("triggerHotjar", config.experiment.id + config.experiment.variation.id);
		window.hj = window.hj || function () {
			(window.hj.q = window.hj.q || []).push(arguments);
		};
		window.hj("trigger", config.experiment.id + config.experiment.variation.id);
	};

	const trackElements = function (elements) {  // courtesy of Michiel Kikkert, @Dutch_Guy

		const errorStack = [];

		const handlerFactory = function (element) {
			let counter = 0,
				threshold = 0;
			return function (event) {
				let currentTime = performance.now(),
					found = false,
					_selectors = document.querySelectorAll(element.selector);
				_selectors.forEach(function (_selector) {
					if (_selector !== null && element.events.includes(event.type) && (event.target.matches(element.selector) || _selector.contains(event.target))) {
						found = true;
					}
				});
				if (!found) return;
				if (threshold === 0) {
					threshold = performance.now() + element.throttle;
					if (element.first) {
						execute();
						element.first = false;
					}
				}
				if (threshold > currentTime) return;
				threshold = 0;
				execute();

				function execute() {
					counter++;
					logger.log("handlerFactory: custom event #" + counter + " tracked", element.tag + " [" + event.type + "]");
					sendDimension(`${element.tag}`, false);
				}
			};
		};
		logger.info("trackElements", elements);
		elements.forEach(function (element) {
			try {
				element.events.forEach(e => {
					logger.log(`trackElements: ${e} eventlistener starting for`, element.tag);
					document.querySelector("body").addEventListener(e, new handlerFactory(element), false)
				});
			} catch (error) {
				errorStack.push[error];
			}
		});
		if (errorStack.length) {
			errorStack.forEach((entry, i) => logger.error(`trackElements error ${i}`, entry));
			sendDimension("trackElements failure: " + errorStack.length + " errors");
		} else {
			sendDimension("trackElements active");
		}
	};

	return {
		sendDimension: sendDimension,
		track: function () {

			const windowLoaded = new Promise( resolve => window.addEventListener("load", resolve, false));
			const experimentLoaded = new Promise( resolve => window.addEventListener("raExperimentLoaded", resolve, false));

			Promise.all([windowLoaded, experimentLoaded]).then(() => {
				logger.log("track: Setting tracking...");
				if (config.pageLoad) sendDimension("Page Load Event");
				if (config.hotjar) triggerHotjar();
				if (config.etc) trackElements(config.etc);
				if (config.ioc) observers.observeIntersections(config.ioc);
			});
		}
	}
};

export default ra_trackers;
