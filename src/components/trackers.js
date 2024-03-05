import ra_observers from "./observers";

const ra_trackers = function (logger, config) {

	const observeIntersections = new ra_observers(logger).observeIntersections;

	const {
		experiment: {
			id: experimentId,
			name: experimentName,
			variation: {
				id: variationId,
				name: variationName
			}
		},
		eventTracker: event_tracker,
		intersectionObserver: intersection_observer
	} = config;

	const sendDimension = (eventAction, eventNonInteraction = true, ga_version = 3) => {

		const ga_data = ga_version === 3 ? {
			eventCategory: `${experimentId}: ${experimentName}`,
			eventAction,
			eventLabel: `${variationId}: ${variationName}`,
			eventNonInteraction // if not sent default to true
		} : {
			exp_event_cat: `${experimentId}: ${experimentName}`,
			exp_event_act: eventAction
		};

		logger.info(`trackers: sendDimension`, {event: `trackEvent`, ...ga_data});

		(window.dataLayer = window.dataLayer || []).push({
			event: `trackEvent`, ...ga_data
		});

	};

	const trackElements = function (element) {

		const errorStack = [], handleError = e => errorStack.push(e);
		const events = typeof element.events !== "undefined" ? element.events : ["click"];

		const handlerFactory = function (el) {

			let counter = 0, previous = 0, selector = el.selector,
				throttle = typeof el.throttle !== "undefined" ? el.throttle : 1000,
				trust = typeof el.trust !== "undefined" ? el.trust : false;

			return function (event) {

				let current = new Date().getTime();

				const execute = () => {
					counter++;
					logger.info(`trackers: handlerFactory: custom event tracked`, {
						tag: el.tag,
						type: event.type,
						counter
					});
					if (typeof element.callback === "function") element.callback();
				}, movedAttribute = "data-ra-moved";
				// do nothing if target does not match selector, or target is not a child of selector (like spans in a button)

				// logger.log("testing element match", {
				// 	match: event.target.matches(selector),
				// 	closest: event.target.closest(selector) !== null
				// });

				if (event.target.matches(selector) || event.target.closest(selector) !== null) {
					// ignore non trusted events when trust is forced
					if (trust && !event.isTrusted) return;
					// prevent triggering a touchend when user swipes element:
					if (event.type === "touchmove") {
						event.target.setAttribute(movedAttribute, "");
						return;
					}
					if (event.type === "touchend" && event.target.hasAttribute(movedAttribute)) { // ignore after a move
						event.target.removeAttribute(movedAttribute);
						return;
					}

					if (previous === 0) execute(); // run the first time
					else {
						if (current - previous <= throttle) return;
						// the difference is bigger, reset previous and fire
						execute();
					}
					previous = current;
				}
			};
		};

		if (events.includes("touchend") && !events.includes("touchmove")) events.push("touchmove");

		events.forEach(type => {
			try {
				logger.info(`trackers: trackElements: setting custom eventListener`, {
					elements: document.querySelectorAll(element.selector),
					tag: element.tag,
					type,
					once: element.once || false,
					capture: element.capture || false
				});
				document.body.addEventListener(type, new handlerFactory(element), {
					once: type === "touchmove" ? true : element.once || false,
					capture: element.capture ? element.capture : false
				});
			} catch (error) {
				handleError(error);
			}
		});

		return errorStack;

	};

	const setSwipeEvents = function () {

		try {

			let pageWidth = window.innerWidth || document.body.clientWidth;
			let threshold = Math.max(1, Math.floor(0.01 * (pageWidth)));
			let touchstartX = 0;
			let touchstartY = 0;
			let touchendX = 0;
			let touchendY = 0;

			const limit = Math.tan(45 * 1.5 / 180 * Math.PI);

			logger.info("trackers: setSwipeEvents", {
				pageWidth,
				threshold,
				limit
			});

			document.body.addEventListener("touchstart", function (event) {
				touchstartX = event.changedTouches[0].screenX;
				touchstartY = event.changedTouches[0].screenY;
			}, false);

			document.body.addEventListener("touchend", function (event) {
				touchendX = event.changedTouches[0].screenX;
				touchendY = event.changedTouches[0].screenY;
				handleGesture(event);
			}, false);

			function handleGesture(e) {
				const x = touchendX - touchstartX;
				const y = touchendY - touchstartY;
				const xy = Math.abs(x / y);
				const yx = Math.abs(y / x);
				const event_data = {
					bubbles: true,
					cancelable: true,
					detail: {
						x,
						y,
						xy,
						yx
					}
				};

				if (Math.abs(x) > threshold || Math.abs(y) > threshold) {
					if (yx <= limit) {
						if (x < 0) {
							e.target.dispatchEvent(new CustomEvent("swiped-left", event_data));
						} else {
							e.target.dispatchEvent(new CustomEvent("swiped-right", event_data));
						}
					}
					if (xy <= limit) {
						if (y < 0) {
							e.target.dispatchEvent(new CustomEvent("swiped-up", event_data));
						} else {
							e.target.dispatchEvent(new CustomEvent("swiped-down", event_data));
						}
					}
				} else {
					logger.info("trackers: setSwipeEvents: tap registered", e.target);
					e.target.dispatchEvent(new Event("click"));
				}
			}

		} catch (error) {
			logger.error("trackers: setSwipeEvents: error caught", error);
		}
	};

	return {
		sendDimension: sendDimension,

		track: function (version) {

			const windowLoaded = new Promise(resolve => {
				if (document.readyState === "complete") resolve(); else window.addEventListener("load", resolve, false);
			});

			const experimentLoaded = new Promise(resolve => window.addEventListener("raExperimentLoaded", resolve, false));

			Promise.all([windowLoaded, experimentLoaded]).then(() => {
				//
				if (event_tracker && event_tracker.active && event_tracker.elements.length) {
					const errors = [];
					event_tracker.elements.forEach(element => {
						errors.concat(trackElements({
							...element,
							callback: () => sendDimension(`${element.tag}`, false, version)
						}));
					});
					if (errors.length) {
						errors.forEach((error, i) => logger.error(`trackers: trackElements error ${i}:`, error));
						sendDimension(`trackElements active, error(s) caught: ${errors.length} error(s)`, true, version);
					}
				} else logger.warn("trackers: track: event tracking disabled");
				//
				if ("ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0) setSwipeEvents();
				//
				if (intersection_observer && intersection_observer.active && intersection_observer.elements.length) {
					intersection_observer.elements.forEach(element => observeIntersections({
						...element,
						inCallback: (e) => sendDimension(`intersection observed: ${e.tag}`, false, version),
						outCallback: null
					}));
				} else logger.warn("trackers: track: intersection observer disabled");
			});
		}
	};
};

export default ra_trackers;
