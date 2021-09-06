import ra_observers from "./observers";

const ra_trackers = function (logger, config, environment) {

	const observeIntersections = new ra_observers(logger).observeIntersections;

	const sendDimension = function (eventAction, eventNonInteraction = true) {
		logger.info("trackers: sendDimension", [eventAction, eventNonInteraction]);
		(window.dataLayer = window.dataLayer || []).push({
			event: `genericEvent`,
			eventCategory: `${config.experiment.id}: ${config.experiment.name}`,
			eventAction,
			eventLabel: `${config.experiment.variation.id}: ${config.experiment.variation.name}`,
			eventNonInteraction // if not sent default to true
		});
	};

	const triggerHotjar = function () {
		logger.info("trackers: triggerHotjar", config.experiment.id + config.experiment.variation.id);
		window.hj = window.hj || function () {
			(window.hj.q = window.hj.q || []).push(arguments);
		};
		window.hj("trigger", config.experiment.id + config.experiment.variation.id);
	};

	const trackElements = function (element) {
		// original function written by Michiel Kikkert, @Dutch_Guy
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
					selectors = document.querySelectorAll(el.selector);

				const execute = () => {
					counter++;
					logger.log(`trackers: handlerFactory: custom event #${counter} tracked`, el.tag + ` [${event.type}]`);
					if (typeof element.callback === "function") element.callback();
				}

				selectors.forEach(selector => found = (
					selector !== null && (
						event.target.matches(el.selector) || selector.contains(event.target))
					)
				);

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

			};
		};
		logger.info("trackers: trackElements", element);

		if (!events.length) {
			if (config.devices.mobile && environment.screenSize === "small" && environment.touchSupport) events.push("touchend"); // smartphone
			if (config.devices.desktop && environment.screenSize !== "small") {
				if (environment.touchSupport) events.push("touchend"); // tablet
				else events.push("mouseup"); // desktop
			}
		}

		if(!events.length) events.push("click");

		events.forEach(e => {
			try {
				logger.log(`trackers: trackElements: ${e} eventListener starting for`, element.tag);
				document.querySelector("body").addEventListener(e, new handlerFactory(element), false)
			} catch (error) {
				errorStack.push[error];
			}
		});

		return errorStack;

	};

	const setSwipeEvents = function (t = window, e = document) {

		logger.info("trackers: setSwipeEvents");

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
		triggerHotjar: triggerHotjar,
		track: function () {

			const windowLoaded = new Promise(resolve => window.addEventListener("load", resolve, false));
			const experimentLoaded = new Promise(resolve => window.addEventListener("raExperimentLoaded", resolve, false));

			Promise.all([windowLoaded, experimentLoaded]).then(() => {
				//
				if (config.devices.mobile && environment.touchSupport) setSwipeEvents();
				//
				//if (config.pageLoad) sendDimension("pageLoad event");
				//else logger.warn("trackers: track: pageLoad tracking disabled");
				//
				if (config.hotjar) triggerHotjar();
				else logger.warn("trackers: track: hotjar tracking disabled");
				//
				if (config.eventTracker.active && config.eventTracker.elements.length) {
					const errors = [];
					config.eventTracker.elements.forEach(e => {
						errors.concat(trackElements({
							...e,
							callback: () => sendDimension(`${e.tag}`, false)
						}))
					});
					if (errors.length) {
						errors.forEach((error, i) => logger.error(`trackers: trackElements error ${i}`, error));
						sendDimension("trackElements active, error(s) caught: " + errors.length + " error(s)");
					} else {
						sendDimension("trackElements active, no errors");
					}
				} else logger.warn("trackers: track: event tracking disabled");
				//
				if (config.intersectionObserver.active && config.intersectionObserver.elements.length) {
					config.intersectionObserver.elements.forEach(element => observeIntersections({
						...element,
						inCallback: (e) => sendDimension(`intersection observed: ${e.tag}`),
						outCallback: null
					}));
				} else logger.warn("trackers: track: intersection observer disabled");
			});
		}
	}
};

export default ra_trackers;
