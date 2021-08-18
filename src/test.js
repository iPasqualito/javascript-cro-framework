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
		//development: true,
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

	framework.init(() => {

		const changeDom = element => {

			console.log("element loaded", element)

			framework.utils.addNodes([{
				tagName: "details",
				attributes: {
					class: "ra-frmwrk-overlay",
					style: "background-color:green;",
					innerHTML: `<p>This is a test to see if we can remove an attribute</p>`
				},
				position: "afterend",
				target: element
			}])

			framework.utils.setElementProperties(d.querySelector("h1"), {
				"data-test": null,
			})

			framework.observers.observeMutations({
				parent: d.body,         // Set to true to extend monitoring to the entire subtree of nodes rooted at target.
				child: "div.banner",    // The element we want to observe mutations on.
				attributeName: "class",
				config: {
					childList: false,   // Set to true to monitor the target node
				                        // and, if subtree is true, its descendants) for the addition of new child nodes or removal of existing child nodes. The default value is false.
					subtree: true,      // Set to true to extend monitoring to the entire
				                        // subtree of nodes rooted at target.
					attributes: true,   // set to true to listen to attribute changes
					attributeFilter: ["class"], // An array of specific attribute names to be monitored.
					attributeOldValue: true,
					characterData: false,   // Set to true to monitor the specified target node (and, if subtree is true,
				                            // its descendants) for changes to the character data
					characterDataOldValue: false    // Set to true to record the previous value of a node's text
				                                    // whenever the text changes on nodes being monitored.
				},
				// function to run when mutation is observed.
				callback: element => console.log("change picked up!", element)
			});

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

		framework.sendDimension(`End of Manual Reached`, false);

	});

})(window, document);
