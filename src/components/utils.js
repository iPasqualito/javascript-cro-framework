const ra_utils = (logger) => {
	const addNodes = (nodes) => nodes.map(({
		tagName,
		attributes,
		position = null,
		target = null
	}) => {
		const node = document.createElement(tagName);
		
		setElementProperties(node, attributes);
		
		if (position && target) {
			if (position === "replace") target.parentNode.replaceChild(node, target); else target.insertAdjacentElement(position, node);
		}
		
		return node;
	});
	
	const addStyle = (css, id) => {
		try {
			if (document.getElementById(id)) {
				logger.warn("utils: addStyle: StyleSheet already exists in DOM");
				return;
			}
			const [link] = addNodes([{
				tagName: "style",
				attributes: {
					id: id,
					rel: "stylesheet",
					type: "text/css"
				},
				position: "beforeend",
				target: document.head
			}]);
			
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
				if (/^(inner|on)\w+$/i.test(key)) element[key] = attributes[key]; else element.setAttribute(key, value);
			}
		});
	};
	
	return {
		addNodes,
		addStyle,
		setElementProperties,
		
		awaitNode: ({
			parent = document,
			selector,
			foundClass = "ra-fwk-found",
			disconnect: quit = true
		}, callback) => {
			
			try {
				
				logger.info("utils: awaitNode: start...", {
					parent,
					selector,
					foundClass,
					quit,
					callback
				});
				
				const elements = document.querySelectorAll(`${selector}:not(.${foundClass})`);
				const handleFind = (elements, mo) => {
						elements.forEach(element => {
							logger.info("utils: awaitNode: element found", {
								selector: `${selector}:not(.${foundClass})`,
								element
							});
							element.classList.add(foundClass);
							callback(element);
						});
						if (mo && quit) {
							logger.info("utils: awaitNode: disconnecting...");
							mo.disconnect();
						}
					};
				if (elements.length > 0) {
					logger.info("utils: awaitNode: element(s) already in DOM", {
						elements,
						selector: `${selector}:not(.${foundClass})`
					});
					handleFind(elements, null);
				}
				//{
				logger.info("utils: awaitNode: kicking off Mutation Observer for:", `${selector}:not(.${foundClass})`);
				if (elements.length === 0 || (elements.length > 0 && quit === false)) {
					new MutationObserver(function (mutationList, observer) {
						for (const {
							type,
							addedNodes
						} of mutationList) {
							if (type !== "childList" || addedNodes.length === 0) return;
							const elementsFound = document.querySelectorAll(`${selector}:not(.${foundClass})`);
							if (elementsFound.length > 0) {
								logger.info("utils: awaitNode: mutation", {
									addedNodes,
									mutationType: type,
									elementsFound: elementsFound.length
								});
								handleFind(elementsFound, this);
							}
						}
					}).observe(typeof parent !== "undefined" ? parent : document, {
						subtree: true,
						childList: true
					});
				}
				//}
			} catch (error) {
				logger.error("utils: awaitNode: error", error);
			}
		},
		
		objectLoaded: function (obj, timeout = 10000) {
			return new Promise((resolve, reject) => {
				const now = performance.now(), testObject = async (o, t) => {
					while (!window.hasOwnProperty(o)) {
						if (performance.now() - now > t) throw new Error("utils: objectLoaded: timeout reached");
						await new Promise(r => setTimeout(r, 100)); //100 should be a small enough gap
					}
					return window[o];
				};
				testObject(obj, timeout).then(resolve).catch(error => {
					reject(`utils: objectLoaded error: ${error}`);
				});
			});
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
				const outer_this = this, outer_arguments = arguments;
				clearTimeout(timer);
				timer = setTimeout(() => {
					func.apply(outer_this, outer_arguments);
				}, delay);
			};
		},

		JSONtoEncodedString: json => encodeURIComponent(JSON.stringify(json)),
		decodedStringToJSON: string => JSON.parse(decodeURIComponent(string))
	};
};

export default ra_utils;
