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
		pageLoad: {
			track: true,
			condition: "document.body.classList.contains(\"awesome\")",
			tag: "Custom Pageload Event" // optional
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

			framework.utils.addStyle(`
				button *, a * {
					pointer-events: none;
				}
			`, `${config.experiment.id}-css`);

			framework.logger.log("element loaded", element);

			element.style.border = "2px solid white";

			framework.utils.setElementProperties(d.querySelector("h1"), {
				"data-test": null,
			});

			framework.storage.cookie.write("ra-framework-test", { data: {
					url: d.location.href,
				},
				expires: 21
			});
			framework.storage.cookie.read("ra-framework-test");
			framework.storage.cookie.read("ra-framework-string");
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
				w.dispatchEvent(new Event("raExperimentLoaded")); // tell tracker experiment code has run

				framework.observers.observeMutations({
					parent: d.body,
					child: "div.banner",
					disconnect: false,
					config: {
						childList: true, subtree: true, attributes: true, characterData: true, attributeName: "class"
					},
					callback(element) {framework.logger.log("OM:", element)}
				})


			} catch (error) {
				framework.logger.error("an error occurred", error);
			}
		});

		framework.logger.log("element loaded");
		framework.logger.info("element loaded");
		framework.logger.warn("element loaded");
		framework.logger.error("element loaded");

	});

})(window, document);
