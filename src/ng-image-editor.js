'use strict';

angular.module('ngImageEditor', [
	'ngImageEditor.directives'
]);

/*Global private helper functions */
function getRotatedRectBB(x, y, width, height, rAngle){
	var absCos = Math.abs(Math.cos(rAngle));
	var absSin = Math.abs(Math.sin(rAngle));
	var cx = x + width / 2 * Math.cos(rAngle) -
		height / 2 * Math.sin(rAngle);
	var cy = y + width / 2 * Math.sin(rAngle) +
		height / 2 * Math.cos(rAngle);
	var w = width * absCos + height * absSin;
	var h = width * absSin + height * absCos;
	return ({
		cx: cx,
		cy: cy,
		width: w,
		height: h
	});
}
