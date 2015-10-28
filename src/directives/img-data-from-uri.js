'use strict';

angular.module('ngImageEditor.directives', [])

/* read a file from a url and convert it to a data src
(this will only work for CORS images, in non-cors supporting browsers
serve images from the same domain as the user is on. */
.directive('imgDataFromUri', [function(){
	return {
		restrict: 'A',
		link: function(scope, element, attributes){
			// Create an empty canvas element
			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('2d');
			var img = new Image();

			img.onload = function(){
				var cw = canvas.width = img.width;
				var ch = canvas.height = img.height;

				// Copy the image contents to the canvas
				ctx.drawImage(img, 0, 0);

				var dataURL = canvas.toDataURL('image/jpeg',1);
				var loadedImgData = new Image();
				loadedImgData.src = dataURL;
				// $(element).css('width', img.width + 'px');
				// $(element).css('height', img.height + 'px');

				if (scope.model) {
					var crop = scope.model.crop(scope);
					if (crop && crop.length > 0) {
						//apply the crop programatically pre-load
						var cropImage = new Image();
						cropImage.src = dataURL;
						var selected = crop;
						selected.w = selected.x2 - selected.x;
						selected.h = selected.y2 - selected.y;
						cw = canvas.width;
						ch = canvas.height;
						// create 2 temporary canvases
						var canvas1 = document.createElement('canvas');
						var ctx1 = canvas1.getContext('2d');
						var canvas2 = document.createElement('canvas');
						var ctx2 = canvas2.getContext('2d');
						var rectBB = getRotatedRectBB(
							selected.x, selected.y, selected.w, selected.h, 0);
						// clip the boundingbox of the crop rect
						// to a temporary canvas
						canvas1.width = canvas2.width = rectBB.width;
						canvas1.height = canvas2.height = rectBB.height;
						ctx1.drawImage(cropImage,
							rectBB.cx - rectBB.width / 2,
							rectBB.cy - rectBB.height / 2,
							rectBB.width,
							rectBB.height,
							0, 0, rectBB.width, rectBB.height);
						ctx2.translate(parseInt(canvas1.width / 2),
							parseInt(canvas1.height / 2));
						ctx2.drawImage(canvas1,
							parseInt(-canvas1.width / 2), parseInt(-canvas1.height / 2));
						// draw the rect to the display canvas
						var offX = rectBB.width / 2 - selected.w / 2;
						var offY = rectBB.height / 2 - selected.h / 2;
						canvas.width = selected.w;
						canvas.height = selected.h;
						cw = canvas.width;
						ch = canvas.height;
						ctx.drawImage(canvas2, -offX, -offY);
						//clear temp variables
						cropImage = canvas1 = canvas2 = ctx1 = ctx2 = offY = offX = null;
						dataURL = canvas.toDataURL('image/jpeg',1);
					}

					if (scope.model.rotation(scope)) {
						//apply any rotation next
						var angle = scope.model.rotation(scope);
						while (angle < 0) {
							angle += 360;
						}
						var rotations = (angle / 90) % 4;
						var rotateImage = new Image();
						rotateImage.src = dataURL;
						//it would be better to do the rotation in one batch,
						//but this will work for now. TODO
						for (var i = 0; i < rotations; i++) {
							canvas.width = ch;
							canvas.height = cw;
							cw = canvas.width;
							ch = canvas.height;
							ctx.save();
							// translate and rotate
							ctx.translate(cw, ch / cw);
							ctx.rotate(Math.PI / 2);
							// draw the previows image, now rotated
							ctx.drawImage(rotateImage, 0, 0);
							ctx.restore();
							rotateImage.src = canvas.toDataURL('image/jpeg',1);
						}
						// clear the temporary image
						rotateImage = null;
						//save
						dataURL = canvas.toDataURL('image/jpeg',1);
					}
				}
				scope.$broadcast('loadedImg', loadedImgData, dataURL);
				element.attr('src', dataURL);
			};

			img.crossOrigin = '';
			attributes.$observe('imgDataFromUri', function(val){
				img.src = val;
			});
		}
	};
}]);
