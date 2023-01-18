import ra_observers from "./observers";

const ra_trackers = function (logger, config) {

	const observeIntersections = new ra_observers(logger).observeIntersections;

	const sendDimension = (eventAction, eventNonInteraction = true) => {
		const data = {
			event: `trackEvent`,
			eventCategory: `${config.experiment.id}: ${config.experiment.name}`,
			eventAction,
			eventLabel: `${config.experiment.variation.id}: ${config.experiment.variation.name}`,
			eventNonInteraction // if not sent default to true
		}
		logger.info("trackers: sendDimension", data);
		(window.dataLayer = window.dataLayer || []).push(data);
	};

	const sendCustomDimension = value => {
		const data = {
			event: "sendCustomDimension",
			dimension: value,
			id: config.experiment.id,
			variantId: config.experiment.variation.id,
			variantName: config.experiment.variation.name
		};
		logger.info("trackers: sendCustomDimension", data);
		(window.dataLayer = window.dataLayer || []).push(data);
	};
	const trackElements = function (element) {
		// original idea by Michiel Kikkert, @Dutch_Guy
		const errorStack = [],
			handleError = e => errorStack.push(e);
		const events = typeof element.events !== "undefined" ? element.events : [];

		const handlerFactory = function (el) {

			let counter = 0,
				previous = 0,
				throttle = typeof el.throttle !== "undefined" ? el.throttle : 1000;

			return function (event) {

				let current = new Date().getTime();

				const execute = () => {
					counter++;
					logger.log(`trackers: handlerFactory: custom event #${counter} tracked (${el.tag} [${event.type}])`);
					if (typeof element.callback === "function") element.callback();
				}, movedAttribute = "data-ra-moved";
				if (!event.target.matches(el.selector)) return;
				// prevent triggering a touchend when user swipes element:
				if (event.type === "touchmove") {
					event.target.setAttribute(movedAttribute, '');
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
			};
		};

		if (events.length === 0) events.push("click");
		if (events.includes("touchend") && !events.includes("touchmove")) events.push("touchmove");

		events.forEach(type => {
			try {
				document.body.addEventListener(type, new handlerFactory(element), {
					once: type === "touchmove" ? true : element.once || false
				});
			} catch (error) {
				handleError(error);
			}
		});

		return errorStack;

	};

	const setSwipeEvents = function () {

		logger.info("trackers: setSwipeEvents");

		try {

			document.addEventListener("touchstart", handleTouchStart, false);
			document.addEventListener("touchmove", handleTouchMove, false);
			document.addEventListener("touchend", handleTouchEnd, false);

			let xDown = null, yDown = null, xDiff = null, yDiff = null, timeDown = null, startEl = null;

			function handleTouchStart(e) {

				// if the element has data-swipe-ignore="true" we stop listening for swipe events
				if (e.target.getAttribute("data-swipe-ignore") === "true") return;

				startEl = e.target;
				timeDown = Date.now();
				xDown = e.touches[0].clientX;
				yDown = e.touches[0].clientY;
				xDiff = 0;
				yDiff = 0;
			}

			function handleTouchMove(e) {

				if (!xDown || !yDown) return;

				const xUp = e.touches[0].clientX, yUp = e.touches[0].clientY;

				xDiff = xDown - xUp;
				yDiff = yDown - yUp;
			}

			function handleTouchEnd(e) {

				// if the user released on a different target, cancel!
				if (startEl !== e.target) return;

				const swipeThreshold = parseInt(getNearestAttribute(startEl, "data-swipe-threshold", "20"), 10); // default 20px
				const swipeTimeout = parseInt(getNearestAttribute(startEl, "data-swipe-timeout", "500"), 10);    // default 500ms
				const timeDiff = Date.now() - timeDown;
				let eventType = "";
				const changedTouches = e.changedTouches || e.touches || [];

				if (Math.abs(xDiff) > Math.abs(yDiff)) { // most significant
					if (Math.abs(xDiff) > swipeThreshold && timeDiff < swipeTimeout) {
						if (xDiff > 0) {
							eventType = "swiped-left";
						} else {
							eventType = "swiped-right";
						}
					}
				} else if (Math.abs(yDiff) > swipeThreshold && timeDiff < swipeTimeout) {
					if (yDiff > 0) {
						eventType = "swiped-up";
					} else {
						eventType = "swiped-down";
					}
				}
				if (eventType !== "") {
					const eventData = {
						bubbles: true,
						cancelable: true,
						detail: {
							dir: eventType.replace(/swiped-/, ""),
							touchType: (changedTouches[0] || {}).touchType || "direct",
							xStart: parseInt(xDown, 10),
							xEnd: parseInt((changedTouches[0] || {}).clientX || -1, 10),
							yStart: parseInt(yDown, 10),
							yEnd: parseInt((changedTouches[0] || {}).clientY || -1, 10)
						}
					};
					// fire `swiped` event on the element that started the swipe
					startEl.dispatchEvent(new CustomEvent("swiped", eventData));
					// fire `swiped-dir` event on the element that started the swipe
					startEl.dispatchEvent(new CustomEvent(eventType, eventData));
				}
				// reset values
				xDown = null;
				yDown = null;
				timeDown = null;
			}

			function getNearestAttribute(el, attributeName, defaultValue) {

				// walk up the dom tree looking for attributeName
				while (el && el !== document.documentElement) {

					const attributeValue = el.getAttribute(attributeName);

					if (attributeValue) return attributeValue;
					el = el.parentNode;
				}

				return defaultValue;
			}
		} catch (error) {
			logger.error("trackers: setSwipeEvents: error caught", error);
		}
	};

	return {
		sendDimension: sendDimension,
		sendCustomDimension: sendCustomDimension,
		track: function () {

			const windowLoaded = new Promise(resolve => {
				if (document.readyState === "complete") resolve();
				else window.addEventListener("load", resolve, false);
			});

			const experimentLoaded = new Promise(resolve => window.addEventListener("raExperimentLoaded", resolve, false));

			Promise.all([windowLoaded, experimentLoaded]).then(() => {

				if (config.eventTracker && config.eventTracker.active && config.eventTracker.elements.length) {
					if (config.eventTracker.customDimension && typeof config.eventTracker.customDimension === "number") this.sendCustomDimension(config.eventTracker.customDimension);
					const errors = [];
					config.eventTracker.elements.forEach(e => {
						errors.concat(trackElements({
							...e,
							callback: () => sendDimension(`${e.tag}`, false)
						}));
					});
					if (errors.length) {
						errors.forEach((error, i) => logger.error(`trackers: trackElements error ${i}:`, error));
						sendDimension(`trackElements active, error(s) caught: ${errors.length} error(s)`);
					}
				} else logger.warn("trackers: track: event tracking disabled");
				//
				if ("ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0) setSwipeEvents();
				//
				if (config.intersectionObserver && config.intersectionObserver.active && config.intersectionObserver.elements.length) {
					config.intersectionObserver.elements.forEach(element => observeIntersections({
						...element,
						inCallback: (e) => sendDimension(`intersection observed: ${e.tag}`),
						outCallback: null
					}));
				} else logger.warn("trackers: track: intersection observer disabled");
			});
		}
	};
};

export default ra_trackers;
