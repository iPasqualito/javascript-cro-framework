const ra_utils = (logger) => {
	const addNodes = (nodes) =>
		nodes.map(({
			tagName,
			attributes,
			position = null,
			target = null
		}) => {
			const node = document.createElement(tagName);
			
			setElementProperties(node, attributes);
			
			if (position && target) {
				if (position === "replace")
					target.parentNode.replaceChild(node, target);
				else target.insertAdjacentElement(position, node);
			}
			
			return node;
		});
	
	const addStyle = (css, id) => {
		try {
			if (document.getElementById(id)) {
				logger.warn("utils: addStyle: StyleSheet already exists in DOM");
				return;
			}
			const [link] = addNodes([
				{
					tagName: "style",
					attributes: {
						id: id,
						rel: "stylesheet",
						type: "text/css"
					},
					position: "beforeend",
					target: document.head
				}
			]);
			
			link.append(document.createTextNode(css));
			
			return link;
		} catch (error) {
			logger.error("utils: addStyle: error", error);
		}
	};
	
	const setElementProperties = (element, attributes) => {
		// iterate through each property
		Object.entries(attributes).map(([key, value]) => {
			if (value === null || typeof value === "undefined") {
				element.removeAttribute(key);
			} else {
				if (/^(inner|on)\w+$/i.test(key)) element[key] = attributes[key];
				else element.setAttribute(key, value);
			}
		});
	};
	
	return {
		addNodes,
		addStyle,
		awaitNode: (parameters, callback) => {
			
			logger.info("utils: awaitNode", [parameters, callback]);
			try {
				const found = typeof parameters.foundClass !== "undefined" ? parameters.foundClass : "ra-fwk-found",
					selector = `${parameters.selector}:not(.${found})`,
					el = document.querySelector(selector),
					handleFind = (element, mo) => {
						element.classList.add(found);
						mo && parameters.disconnect && mo.disconnect();
						callback(element);
					};
				
				if(el) {
					logger.log("utils: awaitNode: element already exists", parameters.tag);
					handleFind(el, null)
				} else {
					logger.log("utils: awaitNode: kicking off Mutation Observer...", parameters.tag);
					new MutationObserver(function () {
						const elementFound = document.querySelector(selector)
						if (elementFound) {
							logger.log("utils: awaitNode: element found", parameters.tag);
							handleFind(elementFound, this)
						}
					}).observe(typeof parameters.parent !== "undefined" ? parameters.parent : document, {
						subtree: true,
						childList: true
					});
				}
			} catch (error) {
				logger.error("utils: awaitNode: error", error);
			}
		},
		awaitNodePromise: (parameters) => {
			return new Promise((resolve, reject) => {
				const found =
						typeof parameters.foundClass !== "undefined"
							? parameters.foundClass
							: "ra-fwk-found",
					selector = `${parameters.selector}:not(.${found})`,
					elements = document.querySelectorAll(selector),
					handleFind = (elements) => {
						elements.forEach((element) => element.classList.add(found));
						resolve(elements);
					};
				if (elements.length) handleFind(elements);
				else {
					new MutationObserver(function () {
						const elements = document.querySelectorAll(selector);
						if (elements.length) {
							handleFind(elements);
							if (parameters.disconnect) this.disconnect();
						}
					}).observe(
						typeof parameters.parent !== "undefined"
							? parameters.parent
							: document,
						{
							subtree: true,
							childList: true
						}
					);
				}
			});
		},
		editQueryParam: (parameters) => {
			let url = new URL(document.location.href),
				searchParams = new URLSearchParams(url.search);
			for (let key in parameters) {
				if (parameters.hasOwnProperty(key)) {
					if (!parameters[key]) {
						searchParams.delete(key);
					} else {
						searchParams.set(key, parameters[key]);
					}
				}
			}
			url.search = searchParams.toString();
			return url.toString();
		},
		throttle: (func, limit = 500) => {
			let waiting = false;
			return function () {
				if (!waiting) {
					func.apply(this, arguments);
					waiting = true;
					setTimeout(function () {
						waiting = false;
					}, limit);
				}
			};
		},
		debounce: (func, delay = 500) => {
			let timer = null;
			return function () {
				const context = this, args = arguments;
				clearTimeout(timer);
				timer = setTimeout(() => {
					func.apply(context, args);
				}, delay);
			};
		},
		setElementProperties
	};
};

export default ra_utils;
