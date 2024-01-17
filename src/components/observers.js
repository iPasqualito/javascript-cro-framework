const ra_observers = function (logger) {
	
	return {
		observeMutations: function (parameters) {
			let found = false;
			
			const handleMutation = function (mutation) {
				let nodeList = [], parent = parameters.parent, children = parent.querySelectorAll(parameters.child);
				
				const getNodeList = (nodes) => Array.from(nodes).filter(node => node.nodeType !== 3 && node.nodeType !== 8 && Array.from(children).includes(node));
				const getNode = (haystack, needle) => Array.from(haystack).includes(needle); // does the children collection contain the mutation target?
				const handleCallback = (element) => {
					found = true;
					parameters.callback(element);
				};
				const handleChildList = ({
					addedNodes,
					removedNodes
				}) => {
					if (addedNodes.length) {
						nodeList = getNodeList(addedNodes);
						for (let node of nodeList) {
							node.classList.add(parameters.foundClass);
							handleCallback(node);
						}
					} else if (removedNodes.length) {
						nodeList = getNodeList(removedNodes);
						for (let node of nodeList) handleCallback(node);
					}
				};
				const handleCharacterData = ({target}) => {
					const mtParent = target.parentElement;
					if (getNode(children, mtParent) && mtParent.nodeName.toLowerCase() === parameters.child) handleCallback(target);
				};
				const handleAttributes = ({target}) => {
					if (getNode(children, target)) handleCallback(target);
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
					logger.info(`observers: observeMutations: disconnecting, goodbye.`);
					observer.disconnect();
				}
			});
			
			observer.observe(parameters.parent, parameters.config);
		},
		observeIntersections: function (element) {
			document.querySelectorAll(element.selector).forEach(function (e) {
				logger.info("observers: observeIntersections: observer starting for", e);
				
				const observer = new IntersectionObserver((entries) => {
					let ran = false;
					entries.forEach(({isIntersecting}) => {
						if (isIntersecting && typeof element.inCallback === "function") {
							logger.info("observers: observeIntersections: intersecting");
							element.inCallback(element);
							ran = true;
						} else if (typeof element.outCallback === "function") {
							logger.info("observers: observeIntersections: not intersecting");
							element.outCallback(element);
							ran = true;
						}
						if (ran && (typeof element.once !== "undefined" ? element.once : true)) {
							logger.info("observers: observeIntersections: disconnecting");
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
	};
};

export default ra_observers;
