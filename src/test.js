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
	hotjar: false,
	pageLoad: false,
	eventTrackerElements: [{
		selector: ".container h1",
		tag: "click on title element",
		events: ["mousedown", "touchend"],
		throttle: 500,
		first: true
	}],
	intersectionObserverElements: [{
		selector: "p.new",
		tag: "new paragraph",
		threshold: 1,
		root: null,
		rootMargin: "0px",
		once: true
	}]
};

const framework = new ra_framework(config);

framework.init(() => {

	const changeDom = element => {

		framework.utils.addStyle(`
			p.elliot.new {
				font-size: 1em;
				border: 1px solid white;
				border-radius:5px;
				margin-top: 24px;
				padding: 12px 48px;
			}
		`, `ra-cro-style`);

		framework.logger.info("element loaded", element);
		const secondElement = framework.utils.addNode("p", {
			"class": "elliot new"
		});
		secondElement.innerText = "Daarom ben ik toegevoegd...";
		element.insertAdjacentElement("afterend", secondElement);
	}

	framework.utils.awaitNode({
		selector: "p.elliot",
		tag: "elliot paragraaf",
		className: "gevonden",
		parent: document,
		recursive: true,
		disconnect: true
	}, element => {
		try {
			changeDom(element);
		} catch (error) {
			framework.logger.error("an error occurred", error);
		} finally {
			window.dispatchEvent(new Event("raExperimentLoaded"));
		}

	});

});
