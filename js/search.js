const searchFunctions = {
	shelfmark: function (book, value) {
		return book["Shelfmark"] == value;
	},

	author: function (book, value) {
		return book["Heading"]
			.toLowerCase()
			.includes(value.toLowerCase());
	},

	title: function (book, value) {
		return book["Title"].toLowerCase().includes(value.toLowerCase());
	},

	daterangestart: function (book, value) {
		let startyear = book["Date1"] * 1;
		return !isNaN(parseInt(value)) && startyear >= value;
	},

	daterangeend: function (book, value) {
		let endyear = book["Date1"] * 1;
		return !isNaN(parseInt(value)) && endyear <= value;
	},

	country: function (book, value) {
		return book["Country"] == value;
	},

	anyfield: function (book, value) {
		for (let [key, prop] of Object.entries(book)) {
			if (prop.toString().toLowerCase().includes(value.toLowerCase())) {
				// if (prop.includes(value)) {
				return true;
			}
		}
		return false;
	},
};

export function findMatchingBooks(books, inputs) {
	let foundBooks = [];
	for (const book of books) {
		let matches = true;
		for (const input of inputs) {
			let inpname = input.getAttribute("name");
			let inpfunc = searchFunctions[inpname];
			if (!inpfunc || input.value === "") continue;

			matches = matches && inpfunc(book, input.value);
		}

		if (matches) {
			book.id = "search-result-" + book["Shelfmark"];
			foundBooks.push(book);
		}
	}
	return foundBooks;
}
