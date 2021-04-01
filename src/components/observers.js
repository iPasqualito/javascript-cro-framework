const ra_observers = function (logger) {

	return {
		observeMutations: function (parameters) {

			logger.info(`observers: observeMutations`, parameters);
			let found = false;

			const handleMutation = function (mutation) {
				let nodeList = [],
					parent = parameters.parent,
					children = parent.querySelectorAll(parameters.child);

				const getNodeList = nodes => Array.from(nodes).filter(node => node.nodeType !== 3 && node.nodeType !== 8 && Array.from(children).includes(node));
				//const getNodeList = nodes => Array.from(nodes).filter(node => node.nodeType !== 3 && node.nodeType !== 8 && node.localName.toLowerCase() === parameters.child.match(/^([a-z]*)[^\.\#[]/)[0].toLowerCase());// we are only interested in nodes with the same tag name.
				const getNode = (haystack, needle) => Array.from(haystack).includes(needle);// does the children collection contain the mutation target?

				const handleChildList = mutation => {
					if (mutation.addedNodes.length) {
						nodeList = getNodeList(mutation.addedNodes);
						for (let node of nodeList) {
							found = true;
							logger.log(`observers: observeMutations: added element:`, node);
							node.classList.add(parameters.foundClass);
							parameters.callback(node);
						}
					} else if (mutation.removedNodes.length) {
						nodeList = getNodeList(mutation.removedNodes);
						for (let node of nodeList) {
							found = true;
							logger.log(`observers: observeMutations: removed element:`, node);
							parameters.callback(node);
						}
					}

				};
				const handleCharacterData = mutation => {
					const mtParent = mutation.target.parentElement;
					if (getNode(children, mtParent) && mtParent.nodeName.toLowerCase() === parameters.child) {
						found = true;
						logger.log(`observers: observeMutations: element characterData changed from "${mutation.oldValue}" to "${mtParent.nodeValue}"`, mutation);
						parameters.callback(mutation.target);
					}
				};

				const handleAttributes = mutation => {
					if (getNode(children, mutation.target)) {
						found = true;
						logger.log(`observers: observeMutations: element ${mutation.attributeName}-attribute changed from "${mutation.oldValue}" to "${mutation.target.getAttribute(parameters.attributeName)}"`);
						parameters.callback(mutation.target);
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
						logger.log(`observers: observeMutations: I have never heard of that fruit...`);
				}
			};

			const observer = new MutationObserver(function (mutations) {
				mutations.forEach(function (mutation) {
					try {
						handleMutation(mutation);
					} catch (error) {
						logger.error(`observers: observeMutations: error caught`, error);
					}
				});
				if (found && parameters.disconnect) {
					logger.log(`observers: observeMutations: disconnecting, goodbye.`);
					observer.disconnect();
				}
			});

			observer.observe(parameters.parent, parameters.config);
		},
		observeIntersections: function (element) {

			logger.info("observers: observeIntersections", element);

			document.querySelectorAll(element.selector).forEach(function (e) {

				logger.log("observers: observeIntersections: observer starting for", e);

				const observer = new IntersectionObserver(function (entries) {
					let ran = false;
					entries.forEach(function (entry) {
						if (entry.isIntersecting && typeof element.inCallback === "function") {
							logger.log("observers: observeIntersections: intersecting");
							element.inCallback(element);
							ran = true;
						} else if (typeof element.outCallback === "function") {
							logger.log("observers: observeIntersections: not intersecting");
							element.outCallback(element);
							ran = true;
						}
						if (ran && (typeof element.once !== "undefined" ? element.once : true)) {
							logger.log("observers: observeIntersections: disconnecting");
							observer.unobserve(e);
						}
					});
				}, {
					root: element.root ? element.root : null,
					rootMargin: element.rootMargin ? element.rootMargin : "0px",
					threshold: element.threshold ? element.threshold : 1
				});
				observer.observe(e);
			});
		}
	}


}

export default ra_observers;
