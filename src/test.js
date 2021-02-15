((w,d) => {

	const config = {
		experiment: {
			id: "ra-000",
			name: "SiteWide - CRO Framework",
			variation: {
				id: "b",
				name: "variant 1"
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
			framework.utils.addNode("p", {
				class: "elliot new",
				innerText: "The test code picked that up and put me here..."
			},"afterend", element);
		}

		framework.utils.awaitNode({
			selector: "p.elliot",
			tag: "elliot paragraaf",
			foundClass: "gevonden",
			parent: d,
			recursive: true,
			disconnect: true
		}, element => {
			try {
				changeDom(element);
			} catch (error) {
				framework.logger.error("an error occurred", error);
			} finally {
				framework.sendDimension("Test code ran successfully");
				w.dispatchEvent(new Event("raExperimentLoaded"));
			}

		});

	});

})(window, document);
