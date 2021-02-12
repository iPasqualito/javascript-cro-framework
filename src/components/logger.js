const ra_logger = function (params) {

	let logStack = [],
		kickOff = performance.now(),
		config = {
			debug: params.debug,
			flushed: false,
			testId: params.experiment.id + params.experiment.variation.id,
			_style: {
				logCSS: "color:#28a745;",
				infoCSS: "color:#17a2b8;",
				warnCSS: "color:#ffc107;",
				errorCSS: "color:#dc3545;"
			}
		},
		timeStamp = () => ((performance.now() - kickOff) / 1000).toFixed(3),
		printRow = function (ts, type, msg, obj) {
			let css = "font-family:roboto;font-size:12px;padding:5px 0;";
			switch (type) {
				case "log":
					css += config._style.logCSS;
					break;
				case "info":
					css += config._style.infoCSS;
					break;
				case "warn":
					css += config._style.warnCSS;
					break;
				case "error":
					css += config._style.errorCSS;
					break;
				default:
					css += config._style.logCSS;
			}
			if (typeof obj === "undefined") {
				if (typeof msg === "object") {
					console.log("%c [" + ts + "s] " + config.testId + " %o", css, msg);
				} else {
					if (typeof msg === "number") {
						console.log("%c [" + ts + "s] " + config.testId + " %f", css, msg);
					} else {
						console.log("%c [" + ts + "s] " + config.testId + " %s", css, msg);
					}
				}
			} else {
				if (typeof obj === "object") {
					console.log("%c [" + ts + "s] " + config.testId + " %s: %o", css, msg, obj);
				} else {
					if (typeof obj === "number") {
						console.log("%c [" + ts + "s] " + config.testId + " %s: %f", css, msg, obj);
					} else {
						console.log("%c [" + ts + "s] " + config.testId + " %s: %s", css, msg, obj);
					}
				}
			}
		},
		printStack = function () {
			for (let row of logStack) {
				printRow(row.ts, row.type, row.msg, row.obj);
			}
		},
		process = function (timestamp, type, msg, obj) {
			logStack.push({
				ts: timestamp,
				type: type,
				msg: msg,
				obj: obj
			});
			if (config.debug) {
				if (!config.flushed && logStack.length > 0) {
					printStack();
					config.flushed = true;
				} else {
					printRow(timestamp, type, msg, obj);
				}
			}
		};
	return {
		printStack: printStack,
		log: function (message, object) {
			process(timeStamp(), "log", message, object);
		},
		info: function (message, object) {
			process(timeStamp(), "info", message, object);
		},
		warn: function (message, object) {
			process(timeStamp(), "warn", message, object);
		},
		error: function (message, object) {
			process(timeStamp(), "error", message, object);
		}
	};
};

export default ra_logger;
