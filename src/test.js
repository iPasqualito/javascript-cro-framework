import ra_framework from "./framework";

const config = {
	experiment: {
		id: "ra-framework-000",
		name: "SiteWide - Another Awesome Test Name Here",
		variation: {
			id: "B",
			name: "Variant 1"
		},
	},
	debug: true,
	devices: {
		mobile: true,
		desktop: true
	},
	hotjar: true,
	pageLoad: true,
	eventTrackerElements: [{
		selector: ".container h1",
		tag: "title",
		events: ["mousedown", "touchend"],
		throttle: 500,
		first: true
	}],
	intersectionObserverElements: [{
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
			window.dispatchEvent(new Event("raExperimentLoaded"));
		}
	});

});
