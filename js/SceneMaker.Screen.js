SceneMaker.Screen = (function(SM,$,undefined){
	var _sceneScreens;
	var _currentScreenIndex;

	var init = function(){
	};

	var getScreens = function(){
		return _sceneScreens;
	};

	var setScreens = function(newScreens){
		_sceneScreens = newScreens;

		//Update slidenumber param
		$.each(_sceneScreens, function(index, value) {
			$(value).attr("slidenumber",index+1);
		});
	};

	var updateScreens = function(){
		var screens = $('section.slides > article');
		setScreens(screens);
		screens.removeClass("current");
		$(getScreenWithNumber(_currentScreenIndex+1)).addClass('current');
	};

	var getCurrentScreen = function(){
		return _sceneScreens[_currentScreenIndex];
	};

	var getCurrentScreenNumber = function(){
		return _currentScreenIndex+1;
	};

	var setCurrentScreenNumber = function(currentScreenNumber){
		_setCurrentScreenIndex(currentScreenNumber-1);
	};

	var _setCurrentScreenIndex = function(newIndex){
		_currentScreenIndex = newIndex;
	};

	var getScreenWithNumber = function(slideNumber){
		var no = slideNumber-1;
		if ((no < 0) || (no >= _sceneScreens.length)) {
			return null;
		} else {
			return _sceneScreens[no];
		}
	};

	var setInitialCurrentScreen = function(currentScreen) {
		if(typeof _currentScreenIndex !== "undefined") return;
		if(typeof screenNumber === "number"){
			setCurrentScreenNumber(currentScreen);
		} else {
			var screenNo = SM.Utils.getScreenNumberFromHash();
			if (screenNo) {
				setCurrentScreenNumber(screenNo);
			} else {
				//Start in 1 (first screen)
				setCurrentScreenNumber(1);
			}
		}
	};

	var getScreensQuantity = function(){
		return $('section.slides > article').length;
	};

	var onEnterScreen = function($screen){
		//Look for opened views
		var $openedView = $screen.children("article.show_in_screen");
		if($openedView.length===1){
			var viewId = $openedView.attr("id");
			SM.Slides.triggerSlideEnterEvent(viewId);
		}
	};

	var onLeaveScreen = function($screen){
		//Close current view, if any
		SM.View.closeCurrentView();
	};

	var forwardOneScreen = function(event){
		_moveScreens(1);
	};

	var backwardOneScreen = function(){
		_moveScreens(-1);
	};

	var _moveScreens = function(n){
		var no = _currentScreenIndex+n+1;
		no = Math.min(Math.max(1,no),_sceneScreens.length);
		goToScreenWithNumber(no);
	};

	var goToScreenWithNumber = function(no,ignoreCurrentScreenNumber){
		if((ignoreCurrentScreenNumber!== true && no === getCurrentScreenNumber())||(no > _sceneScreens.length)||(no <= 0)){
			//Do nothing
			return;
		};

		//Close fancybox
		if((!SM.Editing)&&($.fancybox)){
			$.fancybox.close();
		}

		SM.View.closeCurrentView();

		_goToScreenWithNumber(no);
	};

	var _goToScreenWithNumber = function(no){
		var nextScreenIndex = no - 1;
		if ((nextScreenIndex < _sceneScreens.length)&&(nextScreenIndex >= 0)) {
			triggerScreenLeaveEvent(_currentScreenIndex+1);
			_setCurrentScreenIndex(nextScreenIndex);
			updateScreens();
			triggerScreenEnterEvent(_currentScreenIndex+1);
		}
	};
  
	var goToLastScreen = function(){
		goToScreenWithNumber(_sceneScreens.length);
	};

	var afterSetupSize = function(increaseW,increaseH){
	};

	var triggerScreenEnterEvent = function(screenNumber) {
		var screen = SM.Screen.getScreenWithNumber(screenNumber);
		if (screen) {
			SM.Slides.triggerSlideEnterEvent(screen.id);
		}
	};

	var triggerScreenLeaveEvent = function(screenNumber) {
		var screen = SM.Screen.getScreenWithNumber(screenNumber);
		if (screen) {
			SM.Slides.triggerSlideLeaveEvent(screen.id);
		}
	};

	return {
		init                         : init,
		getScreens                   : getScreens,
		setScreens                   : setScreens,
		updateScreens                : updateScreens,
		getCurrentScreen             : getCurrentScreen,
		getCurrentScreenNumber       : getCurrentScreenNumber,
		setCurrentScreenNumber       : setCurrentScreenNumber,
		getScreenWithNumber          : getScreenWithNumber,
		setInitialCurrentScreen  	 : setInitialCurrentScreen,
		getScreensQuantity           : getScreensQuantity,
		onEnterScreen                : onEnterScreen,
		onLeaveScreen                : onLeaveScreen,
		forwardOneScreen             : forwardOneScreen,
		backwardOneScreen            : backwardOneScreen,
		goToScreenWithNumber         : goToScreenWithNumber,
		goToLastScreen               : goToLastScreen,
		afterSetupSize               : afterSetupSize,
		triggerScreenEnterEvent		 : triggerScreenEnterEvent,
		triggerScreenLeaveEvent		 : triggerScreenLeaveEvent
	};

}) (SceneMaker, jQuery);