const ra_logger = function(cfg) {

	let logStack = [],
		kickOff = performance.now(),
		config = {
			debug: cfg.debug,
			flushed: false,
			id: cfg.experiment.id + cfg.experiment.variation.id,
			color: {
				log: "#28a745;",
				info: "#17a2b8;",
				warn: "#ffc107;",
				error: "#dc3545;"
			}
		},
		timeStamp = () => ((performance.now() - kickOff) / 1000).toFixed(3),
		printRow = ({
            timestamp,
            type,
            message: msg,
            object: obj
		}) => {
			let css = `padding:3px 0;color:${config.color[type]}`;
			if (typeof obj === "undefined") {
				console[type]("%c [" + timestamp + "s] " + (config.id).toUpperCase() + (typeof msg === "object" ? " %o" : (typeof msg === "number" ? " %f" : " %s")), css, msg);
			} else {
				console[type]("%c [" + timestamp + "s] " + (config.id).toUpperCase() + (typeof obj === "object" ? " %s %o" : (typeof obj === "number" ? " %s %f" : " %s %s")), css, msg, obj);
			}
		},
		printStack = () => {
			for (let row of logStack) printRow(row);
		},
		process = function(row) {
			logStack.push(row);
			if (config.debug) printRow(row);
		};
	return {
		printStack: printStack,
		log: (message, object) => process({
			timestamp: timeStamp(),
			type: "log",
			message,
			object
		}),
		info: (message, object) => process({
			timestamp: timeStamp(),
			type: "info",
			message,
			object
		}),
		warn: (message, object) => process({
			timestamp: timeStamp(),
			type: "warn",
			message,
			object
		}),
		error: (message, object) => process({
			timestamp: timeStamp(),
			type: "error",
			message,
			object
		})
	};
};

export default ra_logger;
