'use strict';

angular.module('ngImageEditor.directives', [])

/*Convert a file in the scope into an img src data attribute*/
.directive('imgData', [function(){
		return {
			restrict: 'A',
			link: function(scope, element, attributes){
				var imgData = scope.$eval(attributes.imgData);
				var reader = new FileReader();

				reader.onload = function(){
					scope.$apply(function(){
						var img = new Image();

						img.onload = function(){
							element.attr('src', img.src);
						};

						img.src = reader.result;
						scope.$broadcast('loadedImg', img, img.src);
					});
				};

				reader.readAsDataURL(imgData);
			}
		};
	}
]);
