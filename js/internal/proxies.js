export function NonNullable() {
	return {
		get: function (obj, prop) {
			if (!Object.hasOwn(obj, prop)) {
				throw new Error(`cannot get property ${prop} on object ${obj}`);
			}
			return obj[prop];
		},
	};
}

export function Frozen() {
	let nn = NonNullable();
	nn.set = function (obj, prop, value) {
		throw new Error("cannot modify frozen object");
	};
	return nn;
}

export function ReadOnly() {
	let nn = NonNullable();
	nn.set = function (obj, prop, value) {
		if (Object.hasOwn(obj, prop)) {
			throw new Error("cannot modify existing property on ReadOnly object");
		}

		obj[prop] = value
	};
	return nn;
}


function createAttach(data) {
	return new Proxy(data, this())
}

Frozen.create = createAttach
NonNullable.create = createAttach
