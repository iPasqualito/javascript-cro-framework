const ra_storage = function(logger) {

	return {
		cookie: {
			read: function (key) {
				logger.info("storage: cookie.read", key);
				let result = document.cookie.match("(^|[^;]+)\\s*" + key + "\\s*=\\s*([^;]+)");
				result && (result = JSON.parse(result.pop()));
				return result;
			},
			write: function (key, options) {
				logger.info("storage: cookie.write", [key, options]);
				let date = new Date;
				date.setDate(date.getDate() + (void 0 !== options.expires ? options.expires : 1));
				document.cookie = "" + key + "=" + ("object" === typeof options.data ? JSON.stringify(options.data) : options.data) + ";" +
					"expires=" + date.toUTCString() + ";" +
					"path=" + (void 0 !== options.path ? options.path : "/") + ";" +
					"domain=" + (void 0 !== options.domain ? options.domain : window.location.hostname) + ";" +
					(void 0 !== options.secure ? options.secure ? "Secure;" : "" : "");
			},
			delete: function (key) {
				logger.info("storage: cookie.delete", key);
				document.cookie = [key, "=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/; domain=.", window.location.host].join("");
			}
		},
		localStore: {
			read: function (key) {
				logger.info("storage: localStore.read", key);
				const value = localStorage.getItem(key)
				try {
					return JSON.parse(value);
				} catch (error) {
					return value;
				}
			},
			write: function (key, data) {
				logger.info("storage: localStore.write", key, data);
				if (typeof data === "object") {
					localStorage.setItem(key, JSON.stringify(data));
				} else {
					localStorage.setItem(key, data);
				}
			},
			delete: function (key) {
				logger.info("storage: localStore.delete", key);
				localStorage.removeItem(key);
			}
		}
	}

}

export default ra_storage
