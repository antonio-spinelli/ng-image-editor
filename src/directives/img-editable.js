'use strict';

angular.module('ngImageEditor.directives.imgEditable', [])

/* add listeners for 'crop', 'rotate' and 'rest' brodcasts */
.directive('imgEditable', ['$parse', function($parse){
	return {
		restrict: 'A',
		link: function(scope, element, attributes){
			var jcropApi;
			var croppedImage; //this will be used to support cancel of crop.
			var fullSize = new Image();
			var orig = new Image();

			scope.model = {};
			scope.model.crop = $parse(attributes.crop);
			scope.model.rotation = $parse(attributes.rotation);
			scope.model.trueSize = $parse(attributes.trueSize);
			scope.model.base64 = $parse(attributes.base64);
			scope.$on('loadedImg', function(e, img, base64){
				scope.model.base64.assign(scope, base64);
			});
			scope.$on('update', function(e, base64){
				scope.model.base64.assign(scope, base64);
			});

			if (!scope.crop) {
				scope.crop = false;
			}
			if (!scope.rotation) {
				scope.rotation = 0;
			}
			if (element.attr('src') && element.attr('src').length > 1) {
				fullSize.src = element.attr('src');
			} //load the src if it was already on the dom

			scope.$on('loadedImg', function(e, img, imgSRC){
				//if we are using one of the helpers to load img data
				//this will load the full sized as original and cropped into the view
				fullSize.src = imgSRC;
				orig.src = img.src;
			});

			//listen for actions
			scope.$on('crop', function(){
				scope.cropping = true;
				croppedImage = new Image();
				croppedImage.src = element.attr('src');
				//re-load the full size image,
				//instead of the cropped on so that the user can crop wider
				element.attr('src', fullSize.src);

				//Init Jcrop with old selection if one exists
				console.log([fullSize.width, fullSize.height]);
				if (scope.crop) {
					var pt1 = rotatePoint(scope.crop.x, scope.crop.y,
						orig.width, orig.height, scope.rotation);
					var pt2 = rotatePoint(scope.crop.x2, scope.crop.y2,
						orig.width, orig.height, scope.rotation);
					var selectedInit = [pt1.x, pt1.y, pt2.x, pt2.y];

					$(element).Jcrop({
						'trueSize': [fullSize.width, fullSize.height],
						'setSelect': selectedInit
					}, function(){
						jcropApi = this;
					});
				} else {
					$(element).Jcrop({
						'trueSize': [fullSize.width, fullSize.height],
					}, function() {
						jcropApi = this;
					});
				}
			});

			scope.$on('reset', function(){
				scope.crop = false;
				scope.rotation = 0;
				reset();
				//brodcast update
				scope.$broadcast('update', orig.src);
			});

			scope.$on('save', function(){
				if (scope.cropping) {
					croppedImage = null;
					//main crop function.
					scope.cropping = false;
					//Save the new crop to the scope
					var crop = jcropApi.tellSelect();

					var p1 = rotatePoint(crop.x, crop.y,
						fullSize.width, fullSize.height, -scope.rotation);
					var p2 = rotatePoint(crop.x2, crop.y2,
						fullSize.width, fullSize.height, -scope.rotation);
					var w, h;
					scope.crop = {
						x: p1.x,
						y: p1.y,
						x2: p2.x,
						y2: p2.y
					};
					//save the crop in origin cords
					scope.model.crop.assign(scope, scope.crop);
					//remove jcrop applied width and height for native sizing
					$(element).css('width', '');
					$(element).css('height', '');
					//turn off jcrop
					jcropApi.destroy();
					//apply the crop (requires canvas support)
					applyCrop(crop);
				}
			});

			scope.$on('cancel', function(){
				if (scope.cropping) {
					scope.cropping = false;
					element.attr('src', croppedImage.src);
					$(element).css('width', '');
					$(element).css('height', '');
					croppedImage = null;
					jcropApi.destroy();
				}
				//extend if other methods need cancel support
			});

			//rotate
			scope.$on('rotate', function(){
				scope.rotation = (scope.rotation + 90) % 360;
				//update the model
				scope.model.rotation.assign(scope, scope.rotation);
				doRotate();
			});

			//Functions
			function reset(){
				croppedImage = null;
				element.attr('src', orig.src);
				// $(element).css('width', orig.width + 'px');
				// $(element).css('height', orig.height + 'px');
				fullSize.src = orig.src; //reset the saved crop image as well
			}

			function doRotate(){
				var img = new Image();
				img.onload = function(){
					var myImage;
					var rotating = false;
					var canvas = document.createElement('canvas');
					var ctx = canvas.getContext('2d');
					var cw, ch;
					canvas.width = img.width;
					canvas.height = img.height;
					cw = canvas.width;
					ch = canvas.height;
					ctx.drawImage(img, 0, 0, img.width, img.height);
					if (!rotating) {
						rotating = true;
						// store current data to an image
						myImage = new Image();
						myImage.src = canvas.toDataURL('image/jpeg',1);
						myImage.onload = function(){
							// reset the canvas with new dimensions
							canvas.width = ch;
							canvas.height = cw;
							cw = canvas.width;
							ch = canvas.height;
							ctx.save();
							// translate and rotate
							ctx.translate(parseInt(cw), parseInt(ch / cw));
							ctx.rotate(Math.PI / 2);
							// draw the previows image, now rotated
							ctx.drawImage(myImage, 0, 0);
							ctx.restore();
							// clear the temporary image
							myImage = null;
							rotating = false;
							element.attr('src', canvas.toDataURL('image/jpeg',1));
							scope.$broadcast('update', canvas.toDataURL('image/jpeg',1));
							canvas = null;
						};
					}
				};
				img.src = element.attr('src');
				rotateFullSize();
			}

			function rotateFullSize(){
				//silently rotate the full size image in the background
				var img2 = new Image();
				img2.onload = function(){
					var myImage2, rotating2 = false;
					var canvas2 = document.createElement('canvas');
					var ctx2 = canvas2.getContext('2d');
					var cw2, ch2;
					canvas2.width = img2.width;
					canvas2.height = img2.height;
					cw2 = canvas2.width;
					ch2 = canvas2.height;
					ctx2.drawImage(img2, 0, 0, img2.width, img2.height);
					if (!rotating2) {
						rotating2 = true;
						// store current data to an image
						myImage2 = new Image();
						myImage2.src = canvas2.toDataURL('image/jpeg',1);
						myImage2.onload = function(){
							// reset the canvas with new dimensions
							canvas2.width = ch2;
							canvas2.height = cw2;
							cw2 = canvas2.width;
							ch2 = canvas2.height;
							ctx2.save();
							// translate and rotate
							ctx2.translate(parseInt(cw2), parseInt(ch2 / cw2));
							ctx2.rotate(Math.PI / 2);
							// draw the previows image, now rotated
							ctx2.drawImage(myImage2, 0, 0);
							ctx2.restore();
							// clear the temporary image
							myImage2 = null;
							rotating2 = false;
							var newImgSrc = canvas2.toDataURL('image/jpeg',1);
							canvas2 = null;
							fullSize.src = newImgSrc;
						};
					}
				};
				img2.src = fullSize.src;
			}

			function applyCrop(crop){
				var cropImage = new Image();
				cropImage.src = element.attr('src');
				var canvas = document.createElement('canvas');
				var ctx = canvas.getContext('2d');
				var selected = crop;
				var cw = canvas.width;
				var ch = canvas.height;
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
				element.attr('src', canvas.toDataURL('image/jpeg',1));
				// $(element).css('width', selected.w + 'px');
				// $(element).css('height', selected.h + 'px');
				scope.$broadcast('update', canvas.toDataURL('image/jpeg',1));
				cropImage = canvas = ctx = cw = ch = selected =
					ctx1 = ctx2 = canvas1 = canvas2 = rectBB = offX = offY = null;
			} // end crop using canvas.
			//helper functions

			function rotatePoint(pointX, pointY, width, height, angle){
				if (angle === 0) {
					return {
						x: pointX,
						y: pointY
					};
				} else if (Math.abs(angle) === 180) {
					return {
						x: width - pointX,
						y: height - pointY
					};
				} else {
					var rad = angle * Math.PI / 180.0; //convert to rad
					var x = pointX - width / 2; //convert to normal grid
					var y = pointY - height / 2;
					var offsetX = height / 2,
						offsetY = width / 2;
					return {
						x: parseInt(Math.cos(rad) * x - Math.sin(rad) * y + offsetX),
						y: parseInt(Math.sin(rad) * x + Math.cos(rad) * y + offsetY)
					};
				}
			}
		}
	};
}]);
