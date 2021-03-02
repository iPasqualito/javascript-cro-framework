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

	framework.init(() => {

		console.log(framework.environment);

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
			framework.utils.addNodes([{
				tagName: "p",
				attributes: {
					class: "elliot new",
					innerText: "The test code picked that up and put me here first...",
					onclick: (event) => framework.logger.info("element 1 click", event)
				},
				position: "beforebegin",
				target: element
			}, {
				tagName: "p",
				attributes: {
					class: "elliot new",
					innerText: "The test code picked that up and put me here second...",
					onclick: (event) => framework.logger.info("element 2 click", event)
				},
				position: "afterend",
				target: element
			}]);
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
			} catch (error) {
				framework.logger.error("an error occurred", error);
			} finally {
				framework.sendDimension(`experiment ${config.experiment.id}${config.experiment.variation.id} loaded`);
				w.dispatchEvent(new Event("raExperimentLoaded")); // tell tracker experiment code has run
			}

		});

	});

})(window, document);
