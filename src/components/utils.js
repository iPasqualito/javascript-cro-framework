const ra_utils = (logger) => {

	const addNodes = nodes => nodes.map(({tagName, attributes, position, target}) => {

		const node = document.createElement(tagName);

		setElementProperties(node, attributes);

		if (position && target) {
			if (position === "replace") target.parentNode.replaceChild(node, target);
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
				if (/^(inner|on)\w+$/i.test(key)) {
					element[key] = attributes[key];
				} else {
					element.setAttribute(key, value);
				}
			}
		});
	};

	return {
		addNodes: addNodes,
		addStyle: addStyle,
		awaitNode: (parameters, callback) => {
			try {
				const found = typeof parameters.foundClass !== "undefined" ? parameters.foundClass : "ra-fwk-found",
					selector = `${parameters.selector}:not(.${found})`,
					elements = document.querySelectorAll(selector),
					handleFind = (element, mo) => {
						element.classList.add(found);
						mo && parameters.disconnect && mo.disconnect();
						callback(element);
					};
				if (elements.length > 0) {
					elements.forEach(el => handleFind(el, null));
				} else {
					new MutationObserver(function () {
						const elementFound = document.querySelector(selector);
						if (elementFound) {
							handleFind(elementFound, this);
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
		editQueryParam: parameters => {

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
		setElementProperties: setElementProperties
	};

};

export default ra_utils;
