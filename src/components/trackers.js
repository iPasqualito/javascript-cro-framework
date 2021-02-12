import ra_observers from "./observers";

const ra_trackers = function (logger, config) {

	const observers = new ra_observers(logger);

	const sendDimension = function (eventAction, eventNonInteraction = true) {
		logger.info("sendDimension", eventAction);
		(window.dataLayer = window.dataLayer || []).push({
			event: eventNonInteraction ? `trackEventNI` : `trackEvent`, // if eventNonInteraction is not set default to trackEventNI
			eventCategory: `${config.exp.id}: ${config.exp.name}`,
			eventAction: eventAction,
			eventLabel: `${config.exp.variation.id}: ${config.exp.variation.name}`,
			eventNonInteraction: eventNonInteraction // if not sent default to true
		}); //edgy!
	};

	const triggerHotjar = function () {
		logger.info("triggerHotjar", config.exp.id + config.exp.variation.id);
		window.hj = window.hj || function () {
			(window.hj.q = window.hj.q || []).push(arguments);
		};
		window.hj("trigger", config.exp.id + config.exp.variation.id);
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

	const setSwipeEvents = function (t = window, e = document) {
		logger.info("setSwipeEvents");

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
		} catch (e) {
			logger.error("setSwipeEvents: failed", e);
		}
	}

	return {
		sendDimension: sendDimension,
		track: function () {

			const windowLoaded = new Promise( resolve => window.addEventListener("load", resolve, false));
			const experimentLoaded = new Promise( resolve => window.addEventListener("raExperimentLoaded", resolve, false));

			Promise.all([windowLoaded, experimentLoaded]).then(() => {
				if (config.mob) setSwipeEvents();
				if (config.pld) sendDimension("Page Load Event");
				if (config.htj) triggerHotjar();
				if (config.etc) trackElements(config.etc);
				if (config.ioc) observers.observeIntersections(config.ioc);
			});
		}
	}
};

export default ra_trackers;
