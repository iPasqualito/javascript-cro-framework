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
		eventTracker: et,
		intersectionObserver: io,
		thirdParty: {
			hotjar: runHotjar,
			mouseFlow: runMouseFlow,
			clarity: {
				run: runClarity,
				timeout: clarityTimeout = 5000
			}
		}
	} = config;
	
	const objectLoaded = function (obj, timeout = 10000) {
		return new Promise((resolve, reject) => {
			const now = performance.now(),
				testObject = async (o, t) => {
					while (!window.hasOwnProperty(o)) {
						if( performance.now() - now > t) throw new Error("timeout reached");
						await new Promise(r => setTimeout(r, 100)); //100 should be a small enough gap
					}
					return window[o];
				};
			
			testObject(obj, timeout).then(resolve).catch(error => {
				reject(`objectLoaded: ${error}`);
			});
		});
	};

	const sendDimension = (eventAction, eventNonInteraction = true) => {
		const data = {
			event: `trackEvent`,
			eventCategory: `${experimentId}: ${experimentName}`,
			eventAction,
			eventLabel: `${variationId}: ${variationName}`,
			eventNonInteraction // if not sent default to true
		}
		logger.info("trackers: sendDimension", data);
		(window.dataLayer = window.dataLayer || []).push(data);
	};

	const sendCustomDimension = value => {
		const data = {
			event: "sendCustomDimension",
			dimension: value,
			id: experimentId,
			variantId: variationId,
			variantName: variationName
		};
		logger.info("trackers: sendCustomDimension", data);
		(window.dataLayer = window.dataLayer || []).push(data);
	};
	
	const triggerHotjar = function () {
		try {
			logger.info("trackers: triggerHotjar", experimentId + variationId);
			window.hj = window.hj || function () {
				(window.hj.q = window.hj.q || []).push(arguments);
			};
			window.hj("trigger", experimentId + variationId);
		}
		catch (error) {
			logger.error("trackers: triggerHotjar", error)
		}
	};
	
	const triggerMouseFlow = function () {
		try {
			logger.info("trackers: triggerMouseFlow", experimentId + variationId);
			(window._mfq = window._mfq || []).push(["setVariable", experimentId + variationId, variationName]);
		}
		catch (error) {
			logger.error("trackers: triggerMouseFlow", error)}
	};
	
	const triggerClarity = function (timeout) {
		try {
			objectLoaded("clarity", timeout).then(_clarity => {
				if (typeof _clarity !== "function") throw new Error("Clarity is not a function");
				logger.info("trackers: triggerClarity", {
					experiment: `${experimentId} - ${experimentName}`,
					variation: `${variationId}: ${variationName}`
				});
				_clarity("set", "Experiment", `${experimentId} - ${experimentName}`);
				_clarity("set", "Variation", `${variationId}: ${variationName}`);
			}).catch(error => {
				logger.error("trackers: triggerClarity", error)
			});
		}
		catch (error) {
			logger.error("trackers: triggerClarity", error)
		}
	}
	
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
				logger.log(`trackers: trackElements: setting custom eventListener`, {
					elements: document.querySelectorAll(element.selector),
					tag: element.tag,
					type,
					once: element.once || false
				});
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
				
				console.log("HOTJAR!", {
					config: config.thirdParty.hotjar, runHotjar
				});
				
				//
				if (runHotjar) triggerHotjar();
				else logger.warn("trackers: track: hotjar tracking disabled");
				//
				if (runMouseFlow) triggerMouseFlow();
				else logger.warn("trackers: track: mouseFlow tracking disabled");
				//
				if (runClarity) triggerClarity(clarityTimeout);
				else logger.warn("trackers: track: Clarity tracking disabled");
				//
				if (et && et.active && et.elements.length) {
					if (et.customDimension && typeof et.customDimension === "number") this.sendCustomDimension(et.customDimension);
					const errors = [];
					et.elements.forEach(e => {
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
				if (io && io.active && io.elements.length) {
					io.elements.forEach(element => observeIntersections({
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
