const ra_storage = function(logger) {

	const parseResult = input => {
		try {
			return JSON.parse(input);
		} catch (error) {
			return input;
		}
	}
	
	return {
		cookie: {
			read: (key) => {
				const valueArray = document.cookie.match("(^|[^;]+)\\s*" + key + "\\s*=\\s*([^;]+)");
				if(valueArray) {
					const value = valueArray.pop();
					logger.info("storage: cookie.read", {
						key,
						value
					});
					if (value) return parseResult(value);
				}
			},
			write: (key, {
				data,
				max_age = 1814400, // default to 21 days
				path = "/",
				domain = document.domain,
				secure = false
			}) => {
				logger.info("storage: cookie.write", {
					key,
					data,
					max_age,
					path,
					domain,
					secure
				});
				document.cookie = `${key}=${("object" === typeof data ? JSON.stringify(data) : data)};max-age=${max_age};path=${path};domain=${domain};${secure ? "Secure;" : ""}`;
			},
			delete: (key) => {
				logger.info("storage: cookie.delete", key);
				document.cookie = [key, "=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/; domain=.", window.location.host].join("");
			}
		},
		session_storage: { // using this is preferred, try not to clutter local storage!
			read: (key) => {
				const value = sessionStorage.getItem(key)
				logger.info("storage: session_storage.read", {
					key,
					value
				});
				if (value) return parseResult(value);
			},
			write: (key, data) => {
				logger.info("storage: session_storage.write", key, data);
				if (typeof data === "object") {
					sessionStorage.setItem(key, JSON.stringify(data));
				} else {
					sessionStorage.setItem(key, data);
				}
			},
			delete: (key) => {
				logger.info("storage: session_storage.delete", key);
				sessionStorage.removeItem(key);
			}
		},
		local_storage: {
			read: (key) => {
				const value = localStorage.getItem(key)
				logger.info("storage: local_storage.read", {
					key,
					value
				});
				if (value) return parseResult(value);
			},
			write: (key, data) => {
				logger.info("storage: local_storage.write", key, data);
				if (typeof data === "object") {
					localStorage.setItem(key, JSON.stringify(data));
				} else {
					localStorage.setItem(key, data);
				}
			},
			delete: (key) => {
				logger.info("storage: localStore.delete", key);
				localStorage.removeItem(key);
			}
		}
	}

}

export default ra_storage
