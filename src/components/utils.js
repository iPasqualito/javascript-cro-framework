import ra_observers from "./observers";

const ra_utils = (logger) => {

	const observers = new ra_observers(logger);

	const addNodes = nodes => nodes.map(({tagName, attributes, position, target}) => {

		logger.info("utils: addNodes", [tagName, attributes, position, target]);

		const node = document.createElement(tagName);
		setElementProperties(node, attributes);

		if (position && target) {
			if (position === "replace") target.parentNode.replaceChild(node, target);
			else target.insertAdjacentElement(position, node);
		}

		return node;
	});

	const addStyle = (css, id) => {

		logger.info("utils: addStyle", [css.replace(/(\r\n|\n|\r|\t)/gm, ""), id]);

		try {
			if (document.getElementById(id)) {
				logger.warn("utils: addStyle: StyleSheet already exists in DOM");
			} else {
				const link = addNodes([{
					tagName: 'style',
					attributes: {
						id: id,
						rel: "stylesheet",
						type: "text/css"
					},
					position: "beforeend",
					target: document.head
				}]);
				link[0].appendChild(document.createTextNode(css));
			}
		} catch (error) {
			logger.error("utils: addStyle: error", error);
		}
	};

	const awaitNode = (parameters, callback) => {

		logger.info("utils: awaitNode", [parameters, callback]);

		try {
			const element = document.querySelector(parameters.selector);
			if (element) {
				logger.log("utils: awaitNode: Element already exists");
				element.classList.add(parameters.foundClass)
				callback(element);
			} else {
				logger.log("utils: awaitNode: start mutation observer");
				observers.observeMutations({
					parent: parameters.parent,
					child: parameters.selector,
					tag: parameters.tag,
					foundClass: parameters.foundClass,
					disconnect: parameters.disconnect,
					config: {
						childList: true,
						subtree: parameters.recursive,
					},
					callback: callback
				});
			}
		} catch (error) {
			logger.error("utils: awaitNode: error", error);
		}
	};

	const editQueryParam = (parameters) => {

		logger.info("utils: editQueryParam", parameters);

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
	};

	const getScreenSize = (screenWidth = window.innerWidth) => {

		logger.info("utils: getScreenSize", screenWidth);

		return (screenWidth < 480 ? "small" : (screenWidth >= 480 && screenWidth <= 1024) ? "medium" : "large")
	};

	const isTouchEnabled = () => {

		logger.info("utils: isTouchEnabled");

		return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
	};
	const isMobile = () => {

		logger.info("utils: isMobile");

		const uaDataIsMobile = typeof window.navigator.userAgentData === "undefined" ? "undefined" : window.navigator.userAgentData.mobile;
		const legacyIsMobileCheck = (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
			|| /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4)));

		return typeof uaDataIsMobile === "boolean" ? uaDataIsMobile : legacyIsMobileCheck;
	};

	const setElementProperties = (element, attributes) => {

		logger.info("utils: setElementProperties", [element, attributes]);
		// iterate through each property
		Object.entries(attributes).map(([key, value]) => {
			// match innerText, innerHTML or event attributes (event attributes should be wrapped functions!)
			if (/^(inner|on)\w+$/i.test(key)) element[key] = attributes[key]
			// else just set the attribute
			else element.setAttribute(key, value)
		});
	};

	return {
		addNodes: addNodes,
		addStyle: addStyle,
		awaitNode: awaitNode,
		editQueryParam: editQueryParam,
		getScreenSize: getScreenSize,
		isTouchEnabled: isTouchEnabled,
		isMobile: isMobile,
		setElementProperties: setElementProperties
	}

};

export default ra_utils;
