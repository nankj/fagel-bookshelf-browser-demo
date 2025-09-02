import { NonNullable, Frozen } from "./internal/proxies.js";

export const SharedState = NonNullable.create({
	// Global constants
	CONSTS: Frozen.create({
		MANICULE_RADIUS: 4,
		ZOOM_BREAKPOINTS: ["0vw", "30vw", "50vw", "90vw"],
		PLACE_NAME_MAP: {
			"ne|": "Netherlands",
			enk: "England",
			"be|": "Belgium",
			"gw|": "Germany",
			"fr|": "France",
			"it|": "Italy",
			"sz|": "Switzerland",
		},
		DEFAULT_CSV_RELATIVE_PATH: "res/BayK.csv",
		VOLUME_METADATA_MAP: {
			// Map to assign fields from source data to elements in metadata pane
			// "id of element" : "heading in CSV" <<< structure
			"metadata-list": {
				"metadata-shelfmark": "Shelfmark",
				"metadata-heading": "Heading",
				"metadata-title": "Title",
				"metadata-imprint": "Imprint",
				"metadata-city": "City",
				"metadata-country": "Country",
				"metadata-language": "Language",
				"metadata-subjectSection": "Category",
				"metadata-subject": "Subject",
				"metadata-binding": "Binding",
				"metadata-height": "height",
				// "metadata-width": "Volume width (mm)",
				"metadata-thickness": "width",
				"metadata-dimensionsEstimate": "Measurement_inferred",
				"metadata-lotno": "Lot_no",
				"metadata-link1872": "1872 catalogue link",
			},
			"search-results-list": {
				"search-results-shelfmark": "Shelfmark",
				"search-results-heading": "Heading",
				"search-results-title": "Title",
				"search-results-imprint": "Imprint",
			},
		},
	}),

	globalDataset: {},
	renderableDataset: null,
	currentlyPanning: false,
	library: null,

	currentSvg: null,
	globalSvg: null,
	subshelfEnabled: false,

	lastSearchResults: [],

	// Global proprties for the side pane
	paneWidth: "30vw",
	paneCollapsed: true,
	panZoomInstance: null,

	elements: NonNullable.create({
		pane: document.getElementById("pane"),
		chevron: document.getElementById("chevron-icon"),
		collapser: document.getElementById("chevron"),
		metadataTabBtn: document.getElementById("metadata-pane-button"),
		searchTabBtn: document.getElementById("search-pane-button"),
	}),
});
