import { SharedState } from "./sharedstate.js";
import appfn from "./appfn.js";

function getBookSvgFromId(id) {
	let element = document.getElementById(id);
	if (!element) return;

	return {
		group: element,
		image: element.getElementsByTagName("image")[0],
		data: JSON.parse(element.getElementsByTagName("content")[0].innerHTML),
	};
}

function getAllBooks() {
	return Array.from(document.getElementsByClassName("book")).map(
		function (element) {
			return {
				group: element,
				image: element.getElementsByTagName("image")[0],
				data: JSON.parse(element.getElementsByTagName("content")[0].innerHTML),
			};
		},
	);
}

function hideAllBooksNotInResultSet(shelfmarks) {
	for (let book of getAllBooks()) {
		if (!shelfmarks.includes(book.data.Shelfmark)) {
			book.image.classList.add("search-result-hidden");
		} else {
			book.image.classList.remove("search-result-hidden");
		}
	}
}

function showAllBooks() {
	for (let book of getAllBooks()) {
		book.image.classList.remove("search-result-hidden");
	}
}

function getRandomVolume() {
	let displayedVols = document.getElementsByClassName("true-image");
	if (displayedVols.length == 0) {
		return null;
	}

	let randomVol =
		displayedVols[Math.floor(Math.random() * displayedVols.length)];
	return randomVol.parentElement.id;
}

function jumpToVolume(volumeID, miliseconds) {
	let volume = getBookSvgFromId(volumeID);

	let bRect = volume.group.getBoundingClientRect();

	let brLeft = bRect.left,
		brWidth = bRect.width,
		brTop = bRect.top,
		brHeight = bRect.height;

	let panByAmt = {
		x: brLeft + brWidth / 2,
		y: brTop + brHeight / 2,
	};

	// get the current zoom level:
	let currentZoom = SharedState.panZoomInstance.getZoom();
	// target should be to make bRect.height = 850: volume more or less fills the screen
	// zoomAtPoint requires absolute zoom value, not percentage from current zoon
	// so usually somewhere between 1.5 and 4 for ordinary books
	const targetHeight = 850;
	let targetZoom = 0;
	targetZoom = currentZoom;

	// an improved pan animation
	function customPanBy(amount) {
		// {x: 1, y: 2}
		var animationTime = 300, // ms
			animationStepTime = 15, // one frame per 30 ms
			animationSteps = animationTime / animationStepTime,
			animationStep = 0,
			intervalID = null,
			destX = window.innerWidth / 2 - amount.x, // these two lines centre in the viewport / window
			destY = window.innerHeight / 2 - amount.y,
			stepX = destX / animationSteps,
			stepY = destY / animationSteps;

		intervalID = setInterval(function () {
			if (animationStep++ < animationSteps) {
				SharedState.panZoomInstance.panBy({ x: stepX, y: stepY });
			} else {
				// Cancel interval
				clearInterval(intervalID);
			}
		}, animationStepTime);
	}

	// only animate if milisecond parameter passed in
	if (!miliseconds) {
		SharedState.panZoomInstance.panBy({
			x: window.innerWidth / 2 - panByAmt.x,
			y: window.innerHeight / 2 - panByAmt.y,
		});
	} else {
		customPanBy(panByAmt);
		SharedState.panZoomInstance.zoomAtPoint(targetZoom, {
			x: panByAmt.x,
			y: panByAmt.y,
		});
	}
}

// map fields from metadata embedded in svg to fields in metadata pane
function parseVolumeMetadataForPane(volumeMetadata, map) {
	for (const key in map) {
		let element = document.getElementById(key);
		if (key == "metadata-country") {
			volumeMetadata[map[key]] =
				SharedState.CONSTS.PLACE_NAME_MAP[volumeMetadata[map[key]]];
		}
		let elementInnerText = volumeMetadata[map[key]];
		if (element) {
			element.innerHTML = elementInnerText;
		}
	}
	return;
}

function bookOnClickGenerateCallback(svg, panningMatter = true) {
	// Callback to run when a book is clicked
	return function () {
		if (panningMatter && SharedState.currentlyPanning) {
			SharedState.currentlyPanning = false;
			return; // TODO: Workaround when calling hammer action
		}

		// Open the pane
		SharedState.paneCollapsed = false;
		appfn.doPaneResize();

		SharedState.paneCollapsed = svg.classList.contains("selected-book");
		appfn.doPaneResize();

		// Remove the selected-book class from the currently selected book
		for (let elem of document.getElementsByClassName("selected-book")) {
			elem.classList.remove("selected-book");
		}

		svg.style.transform = "translate(0px, 0px)";

		if (!SharedState.paneCollapsed) {
			svg.classList.add("selected-book");
		}

		let volumeMetadata = JSON.parse(
			svg.getElementsByTagName("content")[0].innerHTML,
		);

		parseVolumeMetadataForPane(
			volumeMetadata,
			SharedState.CONSTS.VOLUME_METADATA_MAP["metadata-list"],
		);

		moveManiculeUnderBook(svg.getAttribute("id"));
		appfn.switchToMetadataPane();
	};
}

function bookOnclick(svg) {
	svg.addEventListener("click", bookOnClickGenerateCallback(svg));
}

function getManicule() {
	let manicule = document.getElementById("the-manicule");
	return manicule;
}

function moveManiculeUnderBook(shelfmark) {
	let book = getBookSvgFromId(shelfmark);
	let [posX, posY] = [
		book.image.getAttribute("x") * 1,
		book.image.getAttribute("y") * 1,
	];

	let [targetX, targetY] = [
		posX + book.data.width / 2,
		posY + book.data.height + 12,
	];

	if (SharedState.subshelfEnabled) {
		return;
	}

	let manicule = getManicule();
	manicule.setAttribute("fill", "white");
	manicule.setAttribute("cx", targetX);
	manicule.setAttribute("cy", targetY);
}

export default {
	bookOnclick: bookOnclick,
	getBookSvgFromId: getBookSvgFromId,
	getRandomVolume: getRandomVolume,
	jumpToVolume: jumpToVolume,
	parseVolumeMetadataForPane: parseVolumeMetadataForPane,
	bookOnClickGenerateCallback: bookOnClickGenerateCallback,
	hideAllBooksNotInResultSet: hideAllBooksNotInResultSet,
	getAllBooks: getAllBooks,
	showAllBooks: showAllBooks,
	// moveManiculeUnderBook: shelfmark,
};
