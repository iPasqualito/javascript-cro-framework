((w, d) => {
	const config = {
		experiment: {
			id: "ra-frw-001",
			name: "Framework Development",
			variation: {
				id: "B",
				name: "variant 1"
			}
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
			elements: [
				{
					selector: ".container button",
					tag: "container button",
				}, {
					selector: ".slider .slide",
					tag: "slider slide",
					events: ["swiped"]
				}
			]
		},
		intersectionObserver: {
			active: false,
			elements: [
				{
					selector: "div.banner",
					tag: "intersection test"
				}
			]
		},
		thirdParty: {
			hotjar: false,
			mouseFlow: false,
			clarity: {
				run: true,
				timeout: 5000
			}
		}
	};
	
	const framework = new ra_framework(config);
	
	framework.init(() => {
		const changeDom = (element) => {
			framework.utils.addStyle(
				`
				button *, a * {
					pointer-events: none;
				}
			`,
				`${config.experiment.id}-css`
			);
			
			framework.logger.log("element loaded", element);
			
			element.style.border = "2px solid white";
			
			// framework.utils.setElementProperties(d.querySelector("h1"), {
			// 	"data-test": null
			// });
			//
			// framework.storage.cookie.write("ra-framework-test", {
			// 	data: {
			// 		url: d.location.href
			// 	},
			// 	expires: 21
			// });
			// framework.storage.cookie.read("ra-framework-test");
			// framework.storage.cookie.read("ra-framework-string");
		};
		
		function onMouseMove(e){
			//console.clear();
			framework.logger.log(e.x, e.y);
		}

		// Define the debounced function
		const debouncedMouseMove = framework.utils.debounce(onMouseMove, 500);

		// Call the debounced function on every mouse move
		w.addEventListener('mousemove', debouncedMouseMove);
		
		
		// framework.utils
	    //      .awaitNodePromise({
		//          selector: "div.slide", // the element we're looking for
		//          tag: "slide", // tag it for identification
		//          foundClass: "ra-001-found", // add a class when it's found
		//          recursive: true, // search the whole tree or just the parent, true by default
		//          disconnect: true // stop looking when element is found
	    //      })
	    //      .then((elements) => {
		//          changeDom(elements);
		//          if (d.body.classList.contains("ra-001-frw")) return;
		//

		//
		//          w.dispatchEvent(new Event("raExperimentLoaded")); // tell tracker experiment code has run
		//          d.body.classList.add("ra-001-frw");
	    //      });
		
		framework.utils.awaitNode({
			selector: "p#elliot",       // the element we're looking for
			tag: "elliot paragraph",    // tag it for identification
			foundClass: "found",        // add a class when it's found
			recursive: true,            // search the whole tree or just the parent, true by default
			disconnect: true            // stop looking when element is found
		}, element => {         // function to run after element is found
			try {
				if (d.body.classList.contains("ra-001-frw")) return;

				changeDom(element);
				
				framework.observers.observeMutations({
					parent: d.body,
					child: "div.banner",
					disconnect: false,
					config: {
						childList: true,
						subtree: true,
						attributes: true,
						characterData: true,
						attributeName: "class"
					},
					callback(element) {
						framework.logger.log("OM:", element);
					}
				});
				
				d.body.classList.add("ra-001-frw");
				
				framework.sendDimension(`experiment ${config.experiment.id}${config.experiment.variation.id} loaded`);
				w.dispatchEvent(new Event("raExperimentLoaded")); // tell tracker experiment code has run
			} catch (error) {
				framework.logger.error("an error occurred", error);
			}
		});
		
	});
})(window, document);
