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
		printRow = function(row) {
			let css = `padding:3px 0;color:${config.color[row.type]}`;
			if (typeof row.obj === "undefined") {
				console.log("%c [" + row.timestamp + "s] " + (config.id).toUpperCase() + (typeof row.msg === "object" ? " %o" : (typeof row.msg === "number" ? " %f" : " %s")), css, row.msg);
			} else {
				console.log("%c [" + row.timestamp + "s] " + (config.id).toUpperCase() + (typeof row.obj === "object" ? " %s %o" : (typeof row.obj === "number" ? " %s %f" : " %s %s")), css, row.msg, row.obj);
			}
		},
		printStack = () => {
			for (let row of logStack) printRow(row);
		},
		process = function(row) {
			logStack.push(row);
			if (config.debug) {
				if (!config.flushed && logStack.length > 0) {
					printStack();
					config.flushed = true;
				} else {
					printRow(row);
				}
			}
		};
	return {
		printStack: printStack,
		log: (message, object) => process({
			timestamp: timeStamp(),
			type: "log",
			msg: message,
			obj: object
		}),
		info: (message, object) => process({
			timestamp: timeStamp(),
			type: "info",
			msg: message,
			obj: object
		}),
		warn: (message, object) => process({
			timestamp: timeStamp(),
			type: "warn",
			msg: message,
			obj: object
		}),
		error: (message, object) => process({
			timestamp: timeStamp(),
			type: "error",
			msg: message,
			obj: object
		})
	};
};

export default ra_logger;
