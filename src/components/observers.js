const ra_observers = function (logger) {

	return {
		observeMutations: function (params) {

			logger.info("observers: observeMutations", params);
			let found = false;

			const handleMutation = function (mutation) {
				let nodeList = [],
					parent = params.parent,
					children = parent.querySelectorAll(params.child);
				const getNodeList = nodes => Array.from(nodes).filter(node => node.nodeType !== 3 && node.nodeType !== 8 && node.localName.toLowerCase() === params.child.match(/^([a-z]*)[^\.\#[]/)[0].toLowerCase());// we are only interested in nodes with the same tag name.
				const getNode = (haystack, needle) => Array.from(haystack).includes(needle);// does the children collection contain the mutation target?

				const handleChildList = mutation => {
					if (mutation.addedNodes.length) {
						nodeList = getNodeList(mutation.addedNodes);
						for (let node of nodeList) {
							found = true;
							logger.log("observers: observeMutations: added element:", node);
							node.classList.add(params.foundClass);
							params.callback(node);
						}
					} else if (mutation.removedNodes.length) {
						nodeList = getNodeList(mutation.removedNodes);
						for (let node of nodeList) {
							found = true;
							logger.log("observers: observeMutations: removed element:", node);
							params.callback(node);
						}
					}

				};
				const handleCharacterData = mutation => {
					const mtParent = mutation.target.parentElement;
					if (getNode(children, mtParent) && mtParent.nodeName.toLowerCase() === params.child) {
						found = true;
						logger.log("observers: observeMutations: element characterData changed from " + mutation.oldValue + " to " + mtParent.nodeValue, mutation);
						params.callback(mutation.target);
					}
				};
				const handleAttributes = mutation => {
					if (getNode(children, mutation.target)) {
						found = true;
						logger.log("observers: observeMutations: element " + mutation.attributeName + " attribute changed from " + mutation.oldValue + " to " + mutation.target.getAttribute(params.attributeName));
						params.callback(mutation.target);
					}
				};

				switch (mutation.type) {
					case "childList":
						handleChildList(mutation);
						break;
					case "characterData":
						handleCharacterData(mutation);
						break;
					case "attributes":
						handleAttributes(mutation);
						break;
					default:
						logger.log("observers: observeMutations: I have never heard of that fruit...");
				}
			};

			const observer = new MutationObserver(function (mutations) {
				mutations.forEach(function (mutation) {
					try {
						handleMutation(mutation);
					} catch (error) {
						logger.error("observers: observeMutations: error caught", error);
					}
				});
				if (found && params.disconnect) {
					logger.log("observers: observeMutations: disconnecting, goodbye.");
					observer.disconnect();
				}
			});

			observer.observe(params.parent, params.config);
		},
		observeIntersections: function (element) {

			logger.info("observers: observeIntersections", element);

			document.querySelectorAll(element.selector).forEach(function (e) {

				logger.log("observers: observeIntersections: observer starting for", e);

				const observer = new IntersectionObserver(function (entries) {
					entries.forEach(function (entry) {
						if (entry.isIntersecting) {
							if (typeof element.inCallback === "function") element.inCallback.call(entry);
						} else {
							if (typeof element.outCallback === "function") element.outCallback.call(entry);
						}
						if (element.once) {
							logger.log("observers: observeIntersections: disconnecting.");
							observer.unobserve(e);
						}
					});
				}, {
					root: element.root,
					rootMargin: element.rootMargin,
					threshold: element.threshold
				});
				observer.observe(e);
			});
		}
	}


}

export default ra_observers;
