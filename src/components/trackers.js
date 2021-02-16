import ra_observers from "./observers";

const ra_trackers = function (logger, config) {

	const observers = new ra_observers(logger);

	const sendDimension = function (eventAction, eventNonInteraction = true) {
		logger.info("trackers: sendDimension", [eventAction, eventNonInteraction]);
		(window.dataLayer = window.dataLayer || []).push({
			event: eventNonInteraction ? `trackEventNI` : `trackEvent`, // if eventNonInteraction is not set default to trackEventNI
			eventCategory: `${config.experiment.id}: ${config.experiment.name}`,
			eventAction: eventAction,
			eventLabel: `${config.experiment.variation.id}: ${config.experiment.variation.name}`,
			eventNonInteraction: eventNonInteraction // if not sent default to true
		});
	};

	const triggerHotjar = function () {
		logger.info("trackers: triggerHotjar", config.experiment.id + config.experiment.variation.id);
		window.hj = window.hj || function () {
			(window.hj.q = window.hj.q || []).push(arguments);
		};
		window.hj("trigger", config.experiment.id + config.experiment.variation.id);
	};

	const trackElements = function (element) {  // courtesy of Michiel Kikkert, @Dutch_Guy

		const errorStack = [];
		const events = typeof element.events !== "undefined" ? element.events : [];

		const handlerFactory = function (el) {
			let counter = 0,
				threshold = 0,
				first = typeof el.first !== "undefined" ? el.first : true,
				throttle = typeof el.throttle !== "undefined" ? el.throttle : 500;
			return function (event) {
				let currentTime = performance.now(),
					found = false,
					_selectors = document.querySelectorAll(el.selector);
				_selectors.forEach(function (_selector) {
					if (_selector !== null && (event.target.matches(el.selector) || _selector.contains(event.target))) {
						found = true;
					}
				});
				if (!found) return;
				if (threshold === 0) {
					threshold = currentTime + throttle;
					if (first) {
						execute();
						first = false;
					}
				}

				if (threshold > currentTime) return;
				threshold = 0;
				execute();

				function execute() {
					counter++;
					logger.log("trackers: handlerFactory: custom event #" + counter + " tracked", el.tag + " [" + event.type + "]");
					sendDimension(`${el.tag}`, false);
				}
			};
		};
		logger.info("trackers: trackElements", element);

		if(events.length === 0){ // default device specific events
			config.devices.desktop && events.push("mouseup");
			config.devices.mobile && events.push("touchend");
		}

		events.forEach(e => {
			try {
				logger.log(`trackers: trackElements: ${e} eventListener starting for`, element.tag);
				document.querySelector("body").addEventListener(e, new handlerFactory(element), false)
			} catch (error) {
				errorStack.push[error];
			}
		});

		if (errorStack.length) {
			errorStack.forEach((entry, i) => logger.error(`trackers: trackElements error ${i}`, entry));
			sendDimension("trackElements error(s) caught: " + errorStack.length + " error(s)");
		} else {
			sendDimension("trackElements active");
		}
	};

	const setSwipeEvents = function (t = window, e = document) {
		logger.info("trackers: setSwipeEvents");
		// <script src="https://gist.github.com/honsa/35282fa386fe5624e3b0502496c9974a.js"></script>
		try {
			"function" != typeof t.CustomEvent && (t.CustomEvent = function (t, n) {
				n = n || {bubbles: !1, cancelable: !1, detail: void 0};
				let u = e.createEvent("CustomEvent");
				return u.initCustomEvent(t, n.bubbles, n.cancelable, n.detail), u
			}, t.CustomEvent.prototype = t.Event.prototype), e.addEventListener("touchstart", function (t) {
				if ("true" === t.target.getAttribute("data-swipe-ignore")) return;
				o = t.target, l = Date.now(), n = t.touches[0].clientX, u = t.touches[0].clientY, a = 0, i = 0
			}, !1), e.addEventListener("touchmove", function (t) {
				if (!n || !u) return;
				let e = t.touches[0].clientX, l = t.touches[0].clientY;
				a = n - e, i = u - l
			}, !1), e.addEventListener("touchend", function (t) {
				if (o !== t.target) return;
				let e = parseInt(o.getAttribute("data-swipe-threshold") || "20", 10),
					s = parseInt(o.getAttribute("data-swipe-timeout") || "500", 10), r = Date.now() - l, c = "";
				Math.abs(a) > Math.abs(i) ? Math.abs(a) > e && r < s && (c = a > 0 ? "swiped-left" : "swiped-right") : Math.abs(i) > e && r < s && (c = i > 0 ? "swiped-up" : "swiped-down");
				"" !== c && o.dispatchEvent(new CustomEvent(c, {bubbles: !0, cancelable: !0}));
				n = null, u = null, l = null
			}, !1);
			let n = null, u = null, a = null, i = null, l = null, o = null
		} catch (error) {
			logger.error("trackers: setSwipeEvents: error caught", error);
		}
	}

	return {
		sendDimension: sendDimension,
		track: function () {

			const windowLoaded = new Promise(resolve => window.addEventListener("load", resolve, false));
			const experimentLoaded = new Promise(resolve => window.addEventListener("raExperimentLoaded", resolve, false));

			Promise.all([windowLoaded, experimentLoaded]).then(() => {
				if (config.devices.mobile) {
					setSwipeEvents();
				}
				if (config.pageLoad) {
					sendDimension("Page Load Event");
				} else {
					logger.warn("trackers: track: pageLoad event not set");
				}
				if (config.hotjar) {
					triggerHotjar();
				} else {
					logger.warn("trackers: track: hotjar not set");
				}
				if (config.eventTrackerElements && config.eventTrackerElements.length) {
					config.eventTrackerElements.forEach(e => trackElements(e));
				} else {
					logger.warn("trackers: track: eventTrackerElements not set");
				}
				if (config.intersectionObserverElements && config.intersectionObserverElements.length) {
					config.intersectionObserverElements.forEach(e => observers.observeIntersections({
						...e,
						inCallback: () => {
							sendDimension(`intersection observed: ${e.tag}`)
						}
					}));
				} else {
					logger.warn("trackers: track: intersectionObserverElements not set");
				}
			});
		}
	}
};

export default ra_trackers;
