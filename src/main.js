import ra_logger from './components/logger.js'
import ra_utils from './components/utils.js'
import ra_observers from './components/observers.js'
import ra_trackers from './components/trackers.js'
import ra_storage from './components/storage.js'
import ra_third_party_tools from './components/third_party_tools.js'

console.log('we are here!')

window.ra_framework = function(config) {

	const logger = ra_logger({
		experiment: config.experiment,
		debug: window.location.hash === '#ra-debug' ? true : config.debug
	})

	const trackers = ra_trackers(logger, config)
	const google_analytics_version = config.eventTracker.ga_version || 4

	return {
		init: callback => {
			try {
				logger.info('framework: init: start', {
					version: '4.8.3.1', ...config
				})
				trackers.track(google_analytics_version)
				if (config.pageLoad.active && Function(config.pageLoad.condition)) trackers.sendDimension(config.pageLoad.tag || 'PageLoad Event', true, google_analytics_version)
				if (typeof callback === 'function') callback.call()
			} catch (e) {
				logger.error('framework: init: error caught', e)
			} finally {
				logger.info('framework: init: done')
			}
		},
		logger,
		utils: ra_utils(logger),
		observers: ra_observers(logger),
		storage: ra_storage(logger),
		third_party_tools: ra_third_party_tools(logger, config),
		sendDimension: trackers.sendDimension
	}
}
