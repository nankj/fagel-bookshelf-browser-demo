import { SharedState } from "./sharedstate.js";
import { findMatchingBooks } from "./search.js";
import bookfn from "./bookfn.js";
import appfn from "./appfn.js";

SharedState.elements.metadataTabBtn.addEventListener(
	"click",
	appfn.switchToMetadataPane,
);

SharedState.elements.searchTabBtn.addEventListener(
	"click",
	appfn.switchToSearchPane,
);

// Toggle the pane when the collapser button is clicked
SharedState.elements.collapser.addEventListener("click", function () {
	SharedState.paneCollapsed = !SharedState.paneCollapsed;
	appfn.doPaneResize();
});

// Resize event listeners
appfn.doResizeActions();
window.addEventListener("resize", appfn.doResizeActions);

// Div where the info about the volume will be inserted (inside pane)
// const volumeMetadataInfo = document.getElementById("metadata-pane");
// Map to assign fields from source data to elements in metadata pane

document.getElementById("search-btn").addEventListener("click", function () {
	let inputs = document
		.getElementById("search-pane")
		.getElementsByClassName("search-field");
	let hits = findMatchingBooks(SharedState.globalDataset, inputs);
	appfn.createSearchResultsHTML(
		hits,
		SharedState.CONSTS.VOLUME_METADATA_MAP["search-results-list"],
	);
});

document
	.getElementById("landing-page-click-me")
	.addEventListener("click", function () {
		appfn.clearLandingPage();
	});

document
	.getElementById("show-results-on-shelves")
	.addEventListener("click", function () {
		let thing = document.getElementById("show-results-on-shelves");
		if (!thing.checked) {
			bookfn.showAllBooks();
		}
	});

document
	.getElementById("subshelf-exit-btn")
	.addEventListener("click", function () {
		appfn.resetSvg();
	});
