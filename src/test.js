((w,d) => {

	const config = {
		experiment: {
			id: "ra-000",
			name: "SiteWide - CRO Framework",
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
			framework.utils.addNode("p", "afterend", element, {
				"class": "elliot new",
				"innerText": "Daarom ben ik hier..."
			});
		}

		framework.utils.awaitNode({
			selector: "p.elliot",
			tag: "elliot paragraaf",
			className: "gevonden",
			parent: d,
			recursive: true,
			disconnect: true
		}, element => {
			try {
				changeDom(element);
			} catch (error) {
				framework.logger.error("an error occurred", error);
			} finally {
				w.dispatchEvent(new Event("raExperimentLoaded"));
			}

		});

	});

})(window, document);
