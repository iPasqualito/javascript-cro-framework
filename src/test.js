((w, d) => {

	const config = {
		experiment: {
			id: "ra-frw",
			name: "SiteWide - CRO Framework",
			variation: {
				id: "x",
				name: "variant 1"
			},
		},
		debug: true,
		devices: {
			mobile: false,
			desktop: true
		},
		hotjar: false,
		pageLoad: false,
		eventTracker: {
			active: true,
			elements: [{
				selector: "body",
				tag: "body click"
			}, {
				selector: ".container h1",
				tag: "hover title",
				events: ["mouseover"],
				throttle: 1000
			}, {
				selector: ".container p.elliot",
				tag: "click on paragraph"
			}, {
				selector: "blorp",
				tag: "blorp on blorp",
				events: ["blorp"]
			}]
		},
		intersectionObserver: {
			active: true,
			elements: [{
				selector: "div.banner",
				tag: "intersection test",
			}]
		}
	};

	const framework = new ra_framework(config);

	const newURL = framework.utils.editQueryParam({
		"framework": "awesome"
	});

	framework.logger.log("newURL", newURL);

	framework.init(() => {

		const changeDom = element => {

	framework.utils.setElementProperties(element, {
		// all HTML attributes are supported :)
		id: "nameofid",
		innerHTML: `<div>Yes you can add innerHTML</div>`,
		onmouseenter: () => {
			// make sure this is a function
		}
	})

		}

		framework.utils.awaitNode({
			selector: "p#elliot",       // the element we're looking for
			tag: "elliot paragraph",    // tag it for identification
			foundClass: "found",        // add a class when it's found
			parent: d,                  // the parent element, narrow the scope
			recursive: true,            // search the whole tree or just the parent
			disconnect: true            // stop looking when element is found
		}, element => {         // function to run after element is found
			try {
				changeDom(element);
				framework.sendDimension(`experiment ${config.experiment.id}${config.experiment.variation.id} loaded`);
				w.dispatchEvent(new Event("raExperimentLoaded")); // tell tracker experiment code has run
			} catch (error) {
				framework.logger.error("an error occurred", error);
			}
		});

	});

})(window, document);
