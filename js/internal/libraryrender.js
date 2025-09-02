export default class LibraryRenderer {
	/**
	 * Constructor for the LibraryRenderer
	 * @param {Array} [dataset] The object to be validated
	 * @param {Function=} [alterSvg] The function that will be called to generate the SVG
	 */
	constructor(dataset, alterSvg = null) {
		this.setData(dataset);
		this.setAlterSvgMethod(alterSvg);
	}

	/**
	 * Get the data that will be used in the generation of the svg
	 * @return {Array} The dataset
	 */
	getData() {
		return this._data;
	}

	/**
	 * Set the data to be used in the generation of an svg
	 * @param {Array} [dataset] The object to be validated
	 */
	setData(dataset) {
		this._data = dataset;
		this._shelves = LibraryRenderer._sortDataIntoShelvesAndBays(this._data);

		for (let idx in this._data) {
			let row = this._data[idx];
			if (!LibraryRenderer._validateDataRow(row)) {
				throw new Error(`Data format incorrect for row at: ${idx}!`);
			}
		}
	}

	/**
	 * Set the callback that will run when the svg is generated
	 * @param {Function} [callback] The object to be validated
	 */
	setAlterSvgMethod(callback) {
		this._alterSvg = callback ?? function (_) {};
	}

	/**
	 * Validate an object to ensure that it contains a numeric width and height, annd a shelfid
	 * @param {Object} [row] The object to be validated
	 * @return {Boolean} Whether or not the row is valid
	 */
	static _validateDataRow(row) {
		return (
			row.width &&
			Number.isInteger(row.width) &&
			row.height &&
			Number.isInteger(row.height) &&
			row.Shelf != null
		);
	}

	/**
	 * Transform the dataset into an Object where the keys are the unique shelfids and the values are Arrays of entries matching that shelfid
	 * @param {Array} [dataset] The dataset, where each row is an Object that fulfils LibraryRenderer._validateDataRow
	 * @return {Object} The resulting object
	 */
	static _sortDataIntoShelves(dataset) {
		let shelves = {};
		for (let row of dataset) {
			if (shelves[row.Shelf] != null) {
				shelves[row.Shelf].push(row);
			} else {
				shelves[row.Shelf] = [row];
			}
		}

		return shelves;
	}

	static _sortDataIntoShelvesAndBays(dataset) {
		let shelves = {};
		for (let row of dataset) {
			if (!shelves[row.Shelf]) {
				shelves[row.Shelf] = {};
			}

			if (shelves[row.Shelf][row.Shelf_section]) {
				shelves[row.Shelf][row.Shelf_section].push(row);
			} else {
				shelves[row.Shelf][row.Shelf_section] = [row];
			}
		}

		return shelves;
	}

	generateSvgSubshelf(dataset, cfg = null) {
		const defaultCfg = {
			gapHeight: 24,
			bookSpacing: 1,
			padding: 24,
			marginLeft: 120,
			bayWidth: 1150,
			shelfVisualWidth: 24,
			shelfVisualHeight: 24,
			shelfColour: "#241710",
			rulerTickHeight: 15,
			rulerTickRate: 50,
		};

		cfg = cfg ?? {};
		for (let [key, value] of Object.entries(defaultCfg)) {
			if (cfg[key] == null) {
				cfg[key] = value;
			}
		}

		let svgRoot = svg.createSvg("svg");

		let y = 500;
		let maxWidth = window.innerWidth;

		let x = cfg.padding + cfg.marginLeft;
		let group = svg.createSvg("g");

		for (let book of dataset) {
			let bookSvg = svg.createRect(
				x,
				y - book.height,
				book.width,
				book.height,
			);
			bookSvg = this._alterSvg(book, bookSvg, 1) ?? bookSvg;

			group.removeAttribute("id");

			x += book.width + cfg.bookSpacing;
			group.appendChild(bookSvg);
		}

		let bsGroup = svg.createSvg("g");
		let bottomShelf = svg.createRect(
			cfg.padding + cfg.marginLeft,
			y,
			x,
			cfg.shelfVisualHeight,
		);
		bottomShelf.setAttribute("fill", cfg.shelfColour);
		bsGroup.appendChild(bottomShelf)
		// svgRoot.appendChild(bottomShelf);

		function mmToHuman(mm) {
			if (mm >= 1000) {
				return `${mm/1000}m`
			}

			if (mm >= 10) {
				return `${mm/10}cm`
			}

			return `${mm}mm`
		}

		let tickSwitch = false;
		let padding = cfg.padding + cfg.marginLeft;

		for (let rulerX = 0; rulerX < x-padding; rulerX += cfg.rulerTickRate) {
			let actualX = rulerX + padding;
			let tickHeight = cfg.rulerTickHeight * ((tickSwitch) ? 2 : 1);
			let tick = svg.createRect(
				actualX,
				y + cfg.shelfVisualHeight,
				1,
				tickHeight,
			);
				{
					let text = svg.createSvg("text");
					text.setAttribute("x", actualX);
					text.setAttribute("y", y + cfg.shelfVisualHeight + tickHeight + 15);
					text.setAttribute("fill", "grey");
					text.style.fontSize = "10px";
					text.style.fontFamily = "";
					text.textContent = mmToHuman(rulerX);
					bsGroup.appendChild(text);
				}

			tick.setAttribute("fill", "grey");
			bsGroup.append(tick)

			tickSwitch = !tickSwitch;
		}

		svgRoot.appendChild(bsGroup);
		svgRoot.appendChild(group);

		y += cfg.gapHeight;
		y += cfg.padding;
		svgRoot.setAttribute("viewBox", `0 0 ${maxWidth} ${window.innerHeight}`);

		return {
			svg: svgRoot,
			viewBox: {
				x: 0,
				y: 0,
				width: maxWidth,
				height: window.innerHeight,
				toPropertyString: function () {
					return `${this.x} ${this.y} ${this.width} ${this.height}`;
				},
			},
		};
	}

	/*
	 * Generate an svg from an instantiated LibraryRenderer
	 * @param {Object=} [cfg] The configuration used to determine alignment rules. Availible keys: shelfHeight (Number), gapHeight (Number), bookSpacing (Number), padding (Number), marginLeft (Number)
	 * @return {Element} The resulting svg
	 */
	generateSvg(cfg = null) {
		const defaultCfg = {
			gapHeight: 24,
			bookSpacing: 1,
			padding: 24,
			marginLeft: 120,
			bayWidth: 1150,
			shelfVisualWidth: 24,
			shelfVisualHeight: 24,
			shelfColour: "#241710",
		};

		cfg = cfg ?? {};
		for (let [key, value] of Object.entries(defaultCfg)) {
			if (cfg[key] == null) {
				cfg[key] = value;
			}
		}

		let svgRoot = svg.createSvg("svg");

		let y = 0;
		let maxWidth = window.innerWidth;

		let topShelf = svg.createRect(
			cfg.padding + cfg.marginLeft,
			y,
			cfg.bayWidth * 3,
			cfg.shelfVisualHeight,
		);
		topShelf.setAttribute("fill", cfg.shelfColour);
		svgRoot.appendChild(topShelf);

		for (let [name, shelf] of Object.entries(this._shelves)) {
			let heights = Object.values(shelf)
				.flat()
				.map((b) => b.height);
			const maxHeight = Math.max(...heights);

			y += maxHeight + cfg.gapHeight;
			let group = svg.createSvg("g");

			{
				let text = svg.createSvg("text");
				text.setAttribute("x", cfg.padding);
				text.setAttribute("y", y - cfg.padding);
				text.setAttribute("fill", "grey");
				text.style.fontSize = "40px";
				text.style.fontFamily = "";
				text.textContent = name;
				group.appendChild(text);
			}

			const paddingAmt = cfg.padding + cfg.marginLeft;
			let x = paddingAmt;

			let r = svg.createRect(x, y, cfg.bayWidth * 3, cfg.shelfVisualHeight);
			r.setAttribute("fill", cfg.shelfColour);
			group.appendChild(r);

			const seperatorHeight = maxHeight + cfg.gapHeight;

			let sv = svg.createRect(
				x,
				y - seperatorHeight,
				cfg.shelfVisualWidth,
				seperatorHeight,
			);
			sv.setAttribute("fill", cfg.shelfColour);
			group.appendChild(sv);

			x += cfg.shelfVisualWidth + cfg.bookSpacing;

			let n = 0;
			let bayN = 0;

			for (let [idx, bay] of Object.entries(shelf)) {
				for (let book of bay) {
					let bookSvg = svg.createRect(
						x,
						y - book.height,
						book.width,
						book.height,
					);
					bookSvg = this._alterSvg(book, bookSvg, n) ?? bookSvg;

					x += book.width + cfg.bookSpacing;
					group.appendChild(bookSvg);
					n++;
				}

				bayN++;
				x = paddingAmt + cfg.bayWidth * bayN;

				let svmid = svg.createRect(
					x,
					y - seperatorHeight,
					cfg.shelfVisualWidth,
					seperatorHeight,
				);
				svmid.setAttribute("fill", cfg.shelfColour);
				group.appendChild(svmid);

				x += cfg.shelfVisualWidth + cfg.bookSpacing;
			}

			x += cfg.padding;
			svgRoot.appendChild(group);
			maxWidth = x > maxWidth ? x : maxWidth;
		}
		y += cfg.gapHeight;
		y += cfg.padding;
		svgRoot.setAttribute("viewBox", `0 0 ${maxWidth} ${y}`);

		return {
			svg: svgRoot,
			viewBox: {
				x: 0,
				y: 0,
				width: maxWidth,
				height: y,
				toPropertyString: function () {
					return `${this.x} ${this.y} ${this.width} ${this.height}`;
				},
			},
		};
	}
}

// Svg generation shorthands
const svg = (function () {
	function createSvg(t) {
		return document.createElementNS("http://www.w3.org/2000/svg", t);
	}

	function createRect(x, y, w, h) {
		let rect = createSvg("rect");
		rect.setAttribute("x", x);
		rect.setAttribute("y", y);
		rect.setAttribute("width", w);
		rect.setAttribute("height", h);

		return rect;
	}

	function createSvgAttrs(t, attrs) {
		let ret = createSvg(t);
		for (let [key, value] in Object.entries(attrs)) {
			ret.setAttributeNS(null, key, value);
		}
	}

	return {
		createSvg: createSvg,
		createRect: createRect,
	};
})();
