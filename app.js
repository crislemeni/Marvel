var app = angular.module('marvel', ['ngSanitize']);

var bookURL = "https://gateway.marvel.com:443/v1/public/comics?format=graphic%20novel&formatType=comic&limit=80&apikey=8e18af49e3d472a7aa6ee2704ffa4426";


/* directives */
app.directive("pageScrollOnEnter", function($document) {
	return function(scope, element, attr) {
		var offset = 20;
		element.on("keydown", function(e){
			var keyPressed = e.keyCode;
			if(keyPressed == 13 || keyPressed == 10 || keyPressed == 27){
				this.blur();
				var elemPos = this.getBoundingClientRect().top;
				var bodyPos = $document[0].body.getBoundingClientRect().top;
				var scrollToPos = elemPos - bodyPos - offset; // value to scroll to
				var timerID = setInterval(function() {
					window.scrollBy(0, 5);
					if(window.pageYOffset >= scrollToPos) clearInterval(timerID);
				}, 10);
			};
		});
	};
});
app.directive("pageScrollTop", function() {
	return function(scope, element, attr) {
		element.on("click", function(){
			var scrollFrom = window.pageYOffset;
			if(scrollFrom <= 1) return;
			var timerID = setInterval(function() {
				scrollFrom-= 80;
				window.scrollTo(0, scrollFrom);
				if(scrollFrom <= 1) clearInterval(timerID);
			}, 10);
		});
	};
});
app.directive('checkOffset', function ($window) {
  return function(scope, element, attrs) {
    angular.element($window).bind("scroll", function() {
      var winHeight = this.innerHeight;
      var pageOffYset = this.pageYOffset;
      if(pageOffYset <= winHeight/2) {
        if(element.hasClass("visible")) element.removeClass("visible");
        return;
      }
      if(element.hasClass("visible") && pageOffYset > winHeight/2) return;
      element.addClass("visible");
    });
  };
});
/* filters */
app.filter('endPage', function () {
	return function(value) {
		if (!value || value == 1) return '';
		return " - " + value;
	};
});

/* functions */
function getByValue(array, key, value, keyToGetValueFrom) {
	for (var i=0; i<array.length; i++) {
		var currentObj = array[i];
		if (currentObj[key] == value) {
			return currentObj[keyToGetValueFrom];
		}
	}
	return false;
}

/* controler */
app.controller('booksCtrl', function($scope, $window, $http) {
	$scope.loading = true;
	$scope.errorMsg = false;
	$http({
		method : "GET",
		url : bookURL
	}).then(function success(response) {
		$scope.bookListJSON = response.data.data.results;
		$scope.bookList = angular.fromJson($scope.bookListJSON);
		$scope.loading = false;
		$scope.simplifiedList = new Array;
		// create a simplified version of the book
		angular.forEach($scope.bookList, function(value,key){
			if(value.title.indexOf('(Graphic Novel)')) {
				value.title = value.title.replace('(Graphic Novel)', '');
			}
			var simpleBook = {
				title: value.title,
				description: value.description
			}
			simpleBook["writer"] = getByValue(value.creators.items,"role","writer","name");
			simpleBook["printPrice"] = getByValue(value.prices,"type","printPrice","price");
			simpleBook["digitalPrice"] = getByValue(value.prices,"type","digitalPurchasePrice","price");
			simpleBook["published"] = getByValue(value.dates,"type","onsaleDate","date");
			var simpleBookChars = new Array;
			angular.forEach(value.characters.items, function(value,key){
				simpleBookChars.push(value.name);
			});
			simpleBook["characters"] = simpleBookChars.join(", ");

			var simpleBookStories = new Array;
			angular.forEach(value.stories.items, function(value,key){
				value.name = value.name.charAt(0).toUpperCase() + value.name.slice(1);
				simpleBookStories.push(value.name);
			});
			simpleBook["stories"] = simpleBookStories.join(", ");
			simpleBook["thumbnail"] = value.thumbnail.path + "/standard_fantastic." + value.thumbnail.extension;
			simpleBook["thumbnailBig"] = value.thumbnail.path + "/portrait_uncanny." + value.thumbnail.extension;

			$scope.simplifiedList.push(simpleBook);
		});

		// search
		$scope.searchTerm = "";
		$scope.searchStarted = "";
		$scope.filteredBookList = $scope.simplifiedList;
		$scope.searchTerm = $scope.searchTerm.toLowerCase();

		$scope.searchResult = function(searchTerm){
			if($scope.simplifiedList.length == 0) return;
			$scope.filteredBookList = new Array;
			$scope.pageStart = 0;
			var searchTerm = searchTerm.toLowerCase();
			$scope.notFoundMsg = "";
			angular.forEach($scope.simplifiedList, function(value,key) {
				if(value.title !== null && value.title.toLowerCase().indexOf(searchTerm)>-1){
				$scope.filteredBookList.push(value); return;}
				if(value.description !== null && value.description.toLowerCase().indexOf(searchTerm)>-1){
				$scope.filteredBookList.push(value); return;}
				if(value.writer && value.writer.toLowerCase().indexOf(searchTerm)>-1){
				$scope.filteredBookList.push(value); return;}
				if(value.characters !== null && value.characters.toLowerCase().indexOf(searchTerm)>-1){
				$scope.filteredBookList.push(value); return;}
				if(value.stories !== null && value.stories.toLowerCase().indexOf(searchTerm)>-1){
				$scope.filteredBookList.push(value); return;}
			});
			$scope.searchStarted = "visible";
			if($scope.filteredBookList.length == 0)
				$scope.notFoundMsg = "Sorry, no books matched your search term: '" + searchTerm + "'.";
		}
		// create details
		$scope.clickedIndex = "";
		$scope.detailsClass = "hidden";
		$scope.createDetails = function($index){
			$scope.clickedIndex = $index;
			$scope.detailsClass = "visible";
		};
		$scope.hideDetails = function(){
			$scope.detailsClass = "hidden";
			$scope.clickedIndex = "";
		};
		$scope.noPropagation = function($event){
			$event.stopPropagation();
		};

	}, function error(response) {
		$scope.statusIs = response.statusText;
		$scope.errorMsg = "An error occured. Please try again later. Sorry for the inconvenience.";
		$scope.loading = false;
	});
});
