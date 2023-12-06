const ra_logger = ({
	experiment,
	debug
}) => {
	const console = window.console || {}, kickOff = performance.now(), config = {
			id: experiment.id + experiment.variation.id,
			color: {
				log: "#28a745;",
				info: "#17a2b8;",
				warn: "#ffc107;",
				error: "#dc3545;"
			}
		}, timeStamp = () => ((performance.now() - kickOff) / 1000).toFixed(3),
		process = (timestamp, type, message, object) => {
			if (!debug) return;
			let css = `padding:3px 0;color:${config.color[type]}`;
			if (typeof object === "undefined") {
				console[type]("%c [" + timestamp + "s] " + (config.id).toUpperCase() + (typeof message === "object" ? " %o" : (typeof message === "number" ? " %f" : " %s")), css, message);
			} else {
				console[type]("%c [" + timestamp + "s] " + (config.id).toUpperCase() + (typeof object === "object" ? " %s %o" : (typeof object === "number" ? " %s %f" : " %s %s")), css, message, object);
			}
		};
	return {
		log: (message, object) => process(timeStamp(), "log", message, object),
		info: (message, object) => process(timeStamp(), "info", message, object),
		warn: (message, object) => process(timeStamp(), "warn", message, object),
		error: (message, object) => process(timeStamp(), "error", message, object)
	};
};

export default ra_logger;
