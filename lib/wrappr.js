var before = function (before, fn) {
	return function () {
		before.apply(this, arguments);
		return fn.apply(this, arguments);
	};
};

var after = function (fn, after) {
	return function () {
		var result = fn.apply(this, arguments);
		after.call(this, result);
		return result;
	};
};

var around = function (fn, over, under) {
  	return before(over, after(fn, under));
};

module.exports = {
	before: before,
	after: after,
	around: around
}