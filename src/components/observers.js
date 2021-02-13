import logger from "../framework";

const ra_observers = function () {

	return {
		observeMutations: function (params) {
			logger.info("observeMutations", params);
			const handleMutation = function (mutation) {
				let nodeList = [],
					added = false,
					parent = params.parent,
					children = parent.querySelectorAll(params.childName + (typeof params.childClass !== "undefined" ? "." + params.childClass : ""));
				const getNodeList = nodes => Array.from(nodes).filter(node => (node.nodeType !== 3 && node.nodeType !== 8 && node.localName.toLowerCase() === params.childName.toLowerCase())),// we are only interested in nodes with the same tag name.
					getNode = (haystack, needle) => Array.from(haystack).includes(needle);// does the children collection contain the mutation target?
				switch (mutation.type) {
					case "childList":
						if (mutation.addedNodes.length) {
							added = true;
							nodeList = getNodeList(mutation.addedNodes);
						} else if (mutation.removedNodes.length) {
							nodeList = getNodeList(mutation.removedNodes);
						}
						for (let node of nodeList) {
							if (node.classList.contains(params.childClass)) {
								logger.log("observeMutations: " + (added ? "added " : "removed ") + "element:", node);
								params.callback(mutation);
							}
						}
						break;
					case "characterData":
						const mtParent = mutation.target.parentElement;
						if (getNode(children, mtParent) && mtParent.nodeName.toLowerCase() === params.childName) {
							logger.log("observeMutations: element characterData changed from " + mutation.oldValue + " to " + mtParent.nodeValue, mutation);
							params.callback(mutation);
						}
						break;
					case "attributes":
						if (getNode(children, mutation.target)) {
							logger.log("observeMutations: element " + mutation.attributeName + " attribute changed from " + mutation.oldValue + " to " + mutation.target.getAttribute(params.attributeName));
							params.callback(mutation);
						}
						break;
					default:
						logger.log("observeMutations: I have never heard of that fruit...");
				}
			};
			const observer = new MutationObserver(function (mutations) {
				mutations.forEach(function (mutation) {
					try {
						handleMutation(mutation);
					} catch (e) {
						logger.error("observeMutations: Error", e);
					}
				});
				if (params.disconnect) {
					logger.log("observeMutations: disconnecting, goodbye.");
					observer.disconnect();
				}
			});
			observer.observe(params.parent, params.config);
		},
		observeIntersections: function (element) {
			logger.info("observeIntersections", element);
			document.querySelectorAll(element.selector).forEach(function (e) {
				logger.log("observeIntersections: observer starting for", e);
				const observer = new IntersectionObserver(function (entries) {
					entries.forEach(function (entry) {
						if (entry.isIntersecting) {
							if (typeof element.inCallback === "function") element.inCallback.call(entry);
						} else {
							if (typeof element.outCallback === "function") element.outCallback.call(entry);
						}
						if (element.once) {
							logger.log("observeIntersections: disconnecting.");
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
