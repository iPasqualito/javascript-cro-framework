((w, d) => {

	const config = {
		experiment: {
			id: "ra-frw-001",
			name: "Framework Development",
			variation: {
				id: "B",
				name: "variant 1"
			},
		},
		development: true,
		debug: true,
		hotjar: false,
		mouseFlow: false,
		pageLoad: {
			track: true,
			condition: "document.body.classList.contains(\"awesome\")"
		},
		eventTracker: {
			active: true,
			customDimension: 9,
			elements: [{
				selector: ".container button",
				tag: "container button",
				events: ["touchmove", "touchend"]
			}, {
				selector: ".slider .slide",
				tag: "slider slide",
				events: ["swiped"]
			}]
		},
		intersectionObserver: {
			active: true,
			elements: [{
				selector: "div.banner",
				tag: "intersection test",
			}]
		},

	};

	const framework = new ra_framework(config);

	framework.init(() => {

		const changeDom = element => {

			framework.logger.error("element loaded", element);

			element.style.border = "2px solid green";

			framework.utils.setElementProperties(d.querySelector("h1"), {
				"data-test": null,
			});

		};

		framework.utils.awaitNode({
			selector: "div.slide",       // the element we're looking for
			tag: "slide",    // tag it for identification
			foundClass: "found",        // add a class when it's found
			recursive: true,            // search the whole tree or just the parent, true by default
			disconnect: true           // stop looking when element is found
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
