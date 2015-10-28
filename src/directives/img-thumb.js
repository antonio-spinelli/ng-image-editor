'use strict';

angular.module('ngImageEditor.directives', [])

.directive('imgThumb', [function(){
	return {
		restrict: 'A',
		link: function(scope, element, attributes){
			scope.$on('loadedImg', function(e, img, imgSRC){
				element.attr('src', imgSRC);
			});
			scope.$on('update', function(e, imgSRC){
				element.attr('src', imgSRC);
			});
		}
	};
}]);
