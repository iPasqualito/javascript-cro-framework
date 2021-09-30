/* jshint esversion: 6 */

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
		development: true,
		debug: true,
		devices: {
			mobile: true,
			desktop: true
		},
		hotjar: false,
		mouseFlow: false,
		pageLoad: {
			track: false,
			// pass the condition we want to test as a string
			condition: 'document.body.classList.contains("awesome")'
		},
		eventTracker: {
			active: false,
			elements: [{
				selector: "body",
				tag: "body swipe left",
				events: ["swiped-left"]
			}, {
				selector: "body",
				tag: "body swipe right",
				events: ["swiped-right"]
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

			console.log("element loaded", element)

			framework.utils.addNodes([{
				tagName: "details",
				attributes: {
					class: "ra-frmwrk-overlay",
					style: "background-color:green;",
					innerHTML: `<p>This is a test to see if we can remove an attribute</p>`,
					onclick: () => {
						framework.sendDimension("Details click")
					}
				},
				position: "afterend",
				target: element
			}])

			framework.utils.setElementProperties(d.querySelector("h1"), {
				"data-test": null,
			})

			framework.utils.setElementProperties(container, {
				"data-swipe-threshold": 100,
				"data-swipe-timeout": 500,
				"data-swipe-ignore": "false"
			});

			document.body.addEventListener("swiped-left", event => {
				framework.logger.log("SWIPE LEFT", event);
			})

			document.body.addEventListener("swiped-right", event => {
				framework.logger.log("SWIPE RIGHT", event);
			})

			document.body.addEventListener("swiped-up", event => {
				framework.logger.log("SWIPE UP", event);
			})

			document.body.addEventListener("swiped-down", event => {
				framework.logger.log("SWIPE DOWN", event);
			})

		}

		framework.utils.awaitNode({
			selector: "p#elliot",       // the element we're looking for
			tag: "elliot paragraph",    // tag it for identification
			foundClass: "found",        // add a class when it's found
			recursive: true,            // search the whole tree or just the parent, true by default
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
