import { hammerEventsHandler } from "./internal/touchscreen.js";
import LibraryRenderer from "./internal/libraryrender.js";
import { findMatchingBooks } from "./search.js";
import { SharedState } from "./sharedstate.js";
import bookfn from "./bookfn.js";
import appfn from "./appfn.js";

function createSvg(t) {
	return document.createElementNS("http://www.w3.org/2000/svg", t);
}

// Callback to run for each book in the LibraryRenderer
let texturedBookRender = function (book, svg, bookNumberHorizontal) {
	// Create an image and add .book class
	let group = createSvg("g");

	let img = document.createElementNS("http://www.w3.org/2000/svg", "image");
	group.classList.add("book");

	function setImgSize(x, y, w, h) {
		img.setAttribute("x", x);
		img.setAttribute("y", y);
		img.setAttribute("width", w);
		img.setAttribute("height", h);
	}

	setImgSize(
		svg.getAttribute("x"),
		svg.getAttribute("y"),
		svg.getAttribute("width"),
		svg.getAttribute("height"),
	);

	img.setAttribute("preserveAspectRatio", "xMidYMid slice");

	// Attach the book click event callback
	bookfn.bookOnclick(group);

	// Fallback image
	function fallbackImage() {
		// Decide on fallback image based on binding type
		let bindingType = book["Binding"]; // TODO: Rename
		let fallbackUrl = "./res/placeholder_texture_vellum.jpg";

		img.setAttribute("href", fallbackUrl);

		if (book["Heading"] == "[Not held in TCD]") {
			img.classList.add("book-not-in-tcd");
			img.removeAttribute("href");
		}

		img.setAttribute("preserveAspectRatio", "none");
		img.classList.add("fallback-texture");
	}

	// Find an image and attach it if availible
	let imgUrl = `./res/spines/${book["Shelfmark"]}.jpg`; // TODO: Rename
	img.setAttribute("href", imgUrl);
	img.addEventListener("error", fallbackImage);
	img.classList.add("true-image");

	// Translate book upwards when hovered
	group.addEventListener("mouseenter", function () {
		if (!img.classList.contains("selected-book")) {
			group.style.transform = "translate(0px, -10px)";
		}
	});

	group.addEventListener("mouseleave", function () {
		group.style.transform = "translate(0px, 0px)";
	});

	let content = createSvg("content");
	content.innerHTML = JSON.stringify(book);

	group.appendChild(img);
	group.appendChild(content);
	group.setAttribute("id", book.Shelfmark);
	return group;
};

// Create empty global LibraryRenderer
SharedState.library = new LibraryRenderer([], texturedBookRender);

// Load the BayK csv data
window.addEventListener("load", function () {
	let request = new XMLHttpRequest();
	// request.open("GET", "res/bigData.csv", false);
	request.open("GET", "res/20250823_Fagel_case_F.csv", false);
	// request.open("GET", SharedState.CONSTS.DEFAULT_CSV_RELATIVE_PATH, false);

	// Update the LibraryRenderer when the data is loaded
	request.addEventListener("load", function () {
		// Parse the csv
		let csvData = request.responseText;
		let parsedCsv = Papa.parse(csvData, { header: true });

		let data = parsedCsv.data;
		data.forEach(function (row) {
			row.width = row.width * 1;
			row.height = row.height * 1;

			if (!LibraryRenderer._validateDataRow(row)) {
				row.missingDataPresent = true;
				row.width = Number.isInteger(row.width) ? row.width : 42;
				row.height = Number.isInteger(row.height) ? row.height : 150;
			}
		});

		// Fix for Papaparse randomly inserting empty row at the bottom
		data = data.filter((x) => x["NA-42_shelfmark"] != "");

		SharedState.globalDataset = data;
		SharedState.library.setData(data);

		// Generate the svg
		// appfn.generateSvgSubshelf();
		appfn.resetSvg();
		SharedState.globalSvg = SharedState.currentSvg;
	});

	request.send();
});
