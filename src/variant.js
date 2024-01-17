((w, d) => {
	const framework_config = {
		experiment: {
			id: "ra-frw-001",
			name: "Framework Development",
			variation: {
				id: "B",
				name: "variant 1"
			}
		},
		debug: true,
		pageLoad: {
			active: true,
			condition: `document.body.classList.contains("awesome")`,
			tag: "Custom Pageload Event" // optional
		},
		eventTracker: {
			ga_version: 4,
			active: true,
			elements: [{
				selector: ".container button",
				tag: "container button",
				throttle: 0,
				trust: true
			}, {
				selector: ".slider .slide",
				tag: "slider slide",
				events: ["swiped-left"]
			}]
		},
		intersectionObserver: {
			active: true,
			elements: [{
				selector: "div.banner",
				tag: "intersection test"
			}]
		}
	};
	
	const framework = new ra_framework(framework_config);
	
	framework.init(({
		experiment: {
			id
		}
	} = framework_config) => {
		const changeDom = (element) => {
			
			framework.logger.log("element loaded", element);
			
			element.style.border = "2px solid green";
			
			framework.utils.addStyle(`
				button>*, a>* { pointer-events: none; }
			`, `${id.toLowerCase()}-style`);
			
			const showHide = () => {
				framework.logger.log("(throttled) showHide", {
					scrollY: w.scrollY
				});
				d.body.classList.toggle("ra-094-fixed", w.scrollY > 100);
			};
			
			showHide();
			
			const throttledShowHide = framework.utils.throttle(showHide);
			
			w.addEventListener("scroll", throttledShowHide);
			w.addEventListener("resize", throttledShowHide);
			
			framework.storage.cookie.write("max-age-test", {
				data: {
					awesomeness: true
				},
				max_age: 300
			});
			
			framework.observers.observeMutations({
				parent: d,
				child: "body",
				tag: "Body Fixed",
				foundClass: "ra-001-found",
				disconnect: false,
				config: {
					childList: true,
					subtree: true,
					attributes: true,
					characterData: true
				},
				callback: function (body) {
					framework.logger.log("mutation observed", body);
				}
			});
			
		};
		
		// function onMouseMove(e){
		// 	//console.clear();
		// 	framework.logger.log(e.x, e.y);
		// }
		//
		// // Define the debounced function
		// const debouncedMouseMove = framework.utils.debounce(onMouseMove, 500);
		//
		// // Call the debounced function on every mouse move
		// w.addEventListener('mousemove', debouncedMouseMove);
		
		// framework.utils.awaitNodePromise({
		// 	selector: "div.slide",
		// 	foundClass: "found",
		// 	disconnect: false
		// }).then(framework.logger.log);
		
		framework.utils.awaitNode({
			selector: "div.slide",
			foundClass: "found",
			disconnect: true
		}, element => {
			try {
				if (d.body.classList.contains("ra-001-frw")) return;
				changeDom(element);
				d.body.classList.add("ra-001-frw");
				w.dispatchEvent(new Event("raExperimentLoaded")); // tell tracker experiment code has run
			} catch (error) {
				framework.logger.error("an error occurred", error);
			}
		});
		
	});
})(window, document);
