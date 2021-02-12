import ra_framework from "./framework";

const config = {
	debug: true,
	hotjar: true,
	pageLoad: false,
	abtest: {
		testId: "ra-framework-000",
		testName: "SiteWide - Another Awesome Test Name Here",
		variationId: "B",
		variation: "Variant 1"
	},
	eventTrackerConfig: [{
		selector: "h1",
		tag: "title",
		events: ["mousedown", "touchend"],
		throttle: 500,
		first: true
	}],
	intersectionObserverConfig: [{
		selector: "h1",
		tag: "title",
		threshold: 1,
		root: null,
		rootMargin: "0px",
		once: true
	}]
};

const framework = new ra_framework(config);

framework.init(() => {

	framework.logger.log("up and running!");

	framework.utils.awaitNode({
		selector: "p.elliot",
		tag: "elliot paragraaf",
		className: "gevonden",
		parent: document,
		recursive: true,
		disconnect: true
	}, element => {
		try {
			framework.logger.info("element loaded", element);
		} catch (error) {
			framework.logger.error("an error occurred", error);
		} finally {
			document.body.classList.add(`${config.abtest.testId + config.abtest.variationId}`);
		}
	});

});
