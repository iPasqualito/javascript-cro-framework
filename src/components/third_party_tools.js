const ra_third_party_tools = function (logger, config) {
	
	const {
		id: experimentId,
		name: experimentName,
		variation: {
			id: variationId,
			name: variationName
		}
	} = config.experiment;
	
	return {
		triggerHotjar: function () {
			try {
				logger.info("third party tools: trigger Hotjar, sending: ", `${experimentId}${variationId}`);
				window.hj = window.hj || function () {
					(window.hj.q = window.hj.q || []).push(arguments);
				};
				window.hj("trigger", `${experimentId}${variationId}`);
			} catch (e) {
				logger.error("third party tools: triggerHotjar error", e);
			}
		},
		triggerMouseFlow: function () {
			try {
				logger.info("third party tools: triggerMouseFlow, sending: ", `${experimentId}${variationId}`);
				(window._mfq = window._mfq || []).push(["setVariable", `${experimentId}${variationId}`, variationName]);
			} catch (e) {
				logger.error("third party tools: triggerMouseFlow error", e);
			}
		},
		triggerClarity: function () {
			try {
				logger.info("third party tools: triggerClarity, sending: ", {
					experiment: `${experimentId} - ${experimentName}`,
					variation: `${variationId}: ${variationName}`
				});
				// Start queuing up calls if Clarity hasn't loaded
				window.clarity = window.clarity || function () {
					(window.clarity.q = window.clarity.q || []).push(arguments);
				};
				window.clarity("set", "Experiment", `${experimentId} - ${experimentName}`);
				window.clarity("set", "Variation", `${variationId}: ${variationName}`);
			} catch (e) {
				logger.error("third party tools: triggerClarity error", e);
			}
		}
	};
};

export default ra_third_party_tools;
