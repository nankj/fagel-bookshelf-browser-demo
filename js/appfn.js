import { SharedState } from "./sharedstate.js";
import bookfn from "./bookfn.js";
import { hammerEventsHandler } from "./internal/touchscreen.js";

// Resize the pane based on whether or not it is collapsed
function doPaneResize() {
	if (SharedState.paneCollapsed) {
		SharedState.elements.pane.style.width =
			SharedState.CONSTS.ZOOM_BREAKPOINTS[0];
		SharedState.elements.pane.style.cursor = "pointer";
		SharedState.elements.pane.style.color = "#ffffff";
		SharedState.elements.chevron.style.transform = "rotate(135deg)";
	} else {
		SharedState.elements.pane.style.cursor = "auto";
		SharedState.elements.pane.style.width = SharedState.paneWidth;
		SharedState.elements.pane.style.color = "#000000";
		SharedState.elements.chevron.style.transform = "rotate(-45deg)";
	}
}

// When the window is resized or loaded, decide which breakpoint to use for the pane
function doResizeActions() {
	let ratio = window.innerWidth / window.innerHeight;
	if (ratio >= 16 / 11) {
		SharedState.paneWidth = SharedState.CONSTS.ZOOM_BREAKPOINTS[1];
	} else if (ratio >= 7 / 8) {
		SharedState.paneWidth = SharedState.CONSTS.ZOOM_BREAKPOINTS[2];
	} else {
		SharedState.paneWidth = SharedState.CONSTS.ZOOM_BREAKPOINTS[3];
	}

	doPaneResize();
}

function createSearchResultsHTML(hits, map) {
	let searchResults = document.getElementById("search-results");

	// get rid of existing results
	while (searchResults.firstChild) {
		searchResults.removeChild(searchResults.firstChild);
	}

	SharedState.lastSearchResults = hits;

	// create html for new search results
	for (const hit of hits) {
		let searchResult = document.createElement("div");
		searchResult.setAttribute("class", "search-result");
		// loop through search result list, add a new <p> with classname [key] and innertext [map[key]]
		// append to searchResult
		for (const key in map) {
			let newPara = document.createElement("p");
			newPara.setAttribute("class", key);
			newPara.innerHTML = hit[map[key]];
			searchResult.appendChild(newPara);
		}
		if (document.getElementById(hit.Shelfmark)) {
			let linkElem = searchResult.firstElementChild;
			// is it currently visualised?
			linkElem.onclick = function () {
				let targetBook = bookfn.getBookSvgFromId(hit.Shelfmark);
				bookfn.jumpToVolume(hit.Shelfmark, 300);
				bookfn.bookOnClickGenerateCallback(targetBook.group, false)();
			};
			linkElem.classList.add("search-result-clickable");
		}
		searchResults.appendChild(searchResult);
	}

	if (hits.length == 0) {
		let noResults = document.createElement("h3");
		noResults.setAttribute("class", "no-results-text-result");
		noResults.innerText = "No Results";
		searchResults.appendChild(noResults)
	}

	searchResults.classList.remove("hidden");

	let convertToSubshelf = document.getElementById("convert-to-subshelf");
	let hideBooksToggle = document.getElementById("show-results-on-shelves");

	if (convertToSubshelf.checked) {
		generateSvgSubshelf(SharedState.lastSearchResults);
		return;
	} else if (hideBooksToggle.checked) {
		bookfn.hideAllBooksNotInResultSet(hits.map((x) => x.Shelfmark));
		SharedState.panZoomInstance.reset();
		SharedState.panZoomInstance.zoomAtPoint(0.15, {
			x: 180,
			y: 50,
		});
	}
}

function clearLandingPage() {
	let landingPage = document.getElementById("landing-page-root");
	landingPage.remove();
}

function switchToMetadataPane() {
	SharedState.elements.metadataTabBtn.classList.remove("deselected-tab");
	SharedState.elements.metadataTabBtn.classList.add("selected-tab");

	SharedState.elements.searchTabBtn.classList.remove("selected-tab");
	SharedState.elements.searchTabBtn.classList.add("deselected-tab");

	if (document.getElementsByClassName("selected-book").length > 0) {
		document.getElementById("metadata-pane").style.display = "block";
		let placeholder = document.getElementById("metadata-placeholder-div");
		if (placeholder) {
			placeholder.remove();
		}
	}
	document.getElementById("search-pane").style.display = "none";
	document.getElementById("search-results").style.display = "none";
}

function switchToSearchPane() {
	SharedState.elements.searchTabBtn.classList.remove("deselected-tab");
	SharedState.elements.searchTabBtn.classList.add("selected-tab");

	SharedState.elements.metadataTabBtn.classList.remove("selected-tab");
	SharedState.elements.metadataTabBtn.classList.add("deselected-tab");

	document.getElementById("metadata-pane").style.display = "none";
	document.getElementById("search-pane").style.display = "block";
	document.getElementById("search-results").style.display = "block";
}

switchToSearchPane();

function applyPanZoom(svg) {
	return svgPanZoom(svg, {
		zoomScaleSensitivity: 0.1,
		dblClickZoomEnabled: false,
		// controlIconsEnabled: true, // + restore - buttons: by default placed in bottom right, miles outside viewport.
		maxZoom: 15,
		minZoom: 0.1,
		onPan: function () {
			SharedState.currentlyPanning = true;
		},
		customEventsHandler: hammerEventsHandler,
	});
}

function addManicule(svgRoot) {
	let manicule = document.createElementNS(
		"http://www.w3.org/2000/svg",
		"circle",
	);
	manicule.setAttribute("r", SharedState.CONSTS.MANICULE_RADIUS);
	manicule.setAttribute("id", "the-manicule");
	manicule.setAttribute("fill", "black");

	svgRoot.appendChild(manicule);
}

function generateSvgSubshelf(dataset) {
	swapSubshelfAround(true);

	// Get the container for the svg and remove current svg
	let svgContainer = document.getElementById("svg-subshelf-container");
	let svgChild = svgContainer.getElementsByTagName("svg")[0];
	if (svgChild) {
		svgContainer.removeChild(svgChild);
	}

	// let dataset = SharedState.library._shelves["F11"]["1"];

	// Generate the svg based on loaded data
	let generatedResult = SharedState.library.generateSvgSubshelf(dataset);

	let generated = generatedResult.svg;
	let viewBox = generatedResult.viewBox;

	generated.style.width = `${viewBox.width}px`;
	generated.style.height = `${viewBox.height}px`;

	addManicule(generated);

	document.querySelector("#svg-subshelf-container").appendChild(generated);
	SharedState.currentSvg = generated;
	SharedState.panZoomInstance = applyPanZoom(generated);
}

function swapSubshelfAround(useSubshelf) {
	let shelf = document.getElementById("svg-container");
	let subshelf = document.getElementById("svg-subshelf-container");

	let keep = useSubshelf ? subshelf : shelf;
	let old = useSubshelf ? shelf : subshelf;

	SharedState.subshelfEnabled = useSubshelf;

	keep.classList.remove("hidden");
	old.classList.add("hidden");

	// Reset the svg you are keeping
	let svgChild = keep.getElementsByTagName("svg")[0];
	if (svgChild) {
		keep.removeChild(svgChild);
	}
}

function resetSvg() {
	swapSubshelfAround(false);

	// Generate the svg based on loaded data
	let generatedResult = SharedState.library.generateSvg({
		bookSpacing: 1,
		gapHeight: 100,
	});
	let generated = generatedResult.svg;
	let viewBox = generatedResult.viewBox;

	generated.style.width = `${viewBox.width}px`;
	generated.style.height = `${viewBox.height}px`;

	addManicule(generated);

	document.querySelector("#svg-container").appendChild(generated);
	SharedState.currentSvg = generated;
	SharedState.panZoomInstance = applyPanZoom(generated);

	bookfn.jumpToVolume("Fag.H.3.60", 0);
}

function resetSvgToGlobal() {
	// Get the container for the svg and remove current svg
	let svgContainer = document.getElementById("svg-container");
	let svgChild = svgContainer.getElementsByTagName("svg")[0];
	if (svgChild) {
		svgContainer.removeChild(svgChild);
	}

	document.querySelector("#svg-container").appendChild(SharedState.globalSvg);
	SharedState.panZoomInstance = applyPanZoom(SharedState.globalSvg);
}

export default {
	doPaneResize: doPaneResize,
	doResizeActions: doResizeActions,
	switchToMetadataPane: switchToMetadataPane,
	switchToSearchPane: switchToSearchPane,
	clearLandingPage: clearLandingPage,
	createSearchResultsHTML: createSearchResultsHTML,
	resetSvg: resetSvg,
	resetSvgToGlobal: resetSvgToGlobal,
	generateSvgSubshelf: generateSvgSubshelf,
	swapSubshelfAround: swapSubshelfAround,
};
