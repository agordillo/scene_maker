SceneMaker.FullScreen = (function(SM,$,undefined){
	//Native FS params
	var _currentFSElement;
	var _lastFSElement;
	var _lastFSTimestamp;

	var init = function(){
		_addContainerFSAttributes();
		_updateFsButtons();
	};

	var _addContainerFSAttributes = function(){
		try {
			var container = SM.Status.getContainer();
			if(typeof container !== "undefined"){
				//App is embed, but not in external domain
				if(typeof $(container).attr("allowfullscreen") === "undefined"){
					$(container).attr("allowfullscreen","true");
					$(container).attr("webkitAllowFullScreen","true");
					$(container).attr("mozallowfullscreen","true");
				} else if($(container).attr("allowfullscreen") === "false"){
					//Allow to explicitly disable fs
					$(container).removeAttr("allowfullscreen");
					$(container).removeAttr("webkitAllowFullScreen");
					$(container).removeAttr("mozallowfullscreen");
					return;
				}

				var fsElementTarget = _getFSElementTarget();
				if(SM.Status.getContainerType()==="OBJECT"){
					//Add FS style
					$(container).addClass("ScreenMakerFS");
					$(fsElementTarget).addClass("ScreenMakerFS");
					$(window.parent.document).find("head").append("<style>.ScreenMakerFS:full-screen, :full-screen > object.ScreenMakerFS {width: 100% !important;height: 100% !important;}</style>");
					$(window.parent.document).find("head").append("<style>.ScreenMakerFS:-webkit-full-screen, :-webkit-full-screen > object.ScreenMakerFS {width: 100% !important;height: 100% !important;}</style>");
					$(window.parent.document).find("head").append("<style>.ScreenMakerFS:-moz-full-screen, :-moz-full-screen > object.ScreenMakerFS {width: 100% !important;height: 100% !important;}</style>");
				}
			}
		} catch(e){}
	};

	var _updateFsButtons = function(){
		if(isFullScreen()){
			//enableFsEnterButon
			$("#page-fullscreen").removeClass("fsoff").addClass("fson");
		} else {
			//enableFsLeaveButon
			$("#page-fullscreen").removeClass("fson").addClass("fsoff");
		}
	};

	var isFullScreenSupported = function(){
		var elem = document.createElement('div');
		if(elem && (elem.requestFullScreen || elem.mozRequestFullScreen || elem.webkitRequestFullScreen || elem.msRequestFullscreen)){
			return true;
		} else {
			return false;
		}
	};

	var canFullScreen = function(){
		return ((!SM.Editing)&&(_canUseNativeFs()));
	};

	var _canUseNativeFs = function(){
		return (SM.Status.getFeatures().fullscreen)&&(_getFsEnabled(_getFSDocumentTarget()));
	};

	var _getFsEnabled = function(myDoc){
		return myDoc.fullscreenEnabled || myDoc.mozFullScreenEnabled || myDoc.webkitFullscreenEnabled || myDoc.msFullscreenEnabled;
	};

	var enableFullScreen = function(){
		$(document).on('click', '#page-fullscreen', _toggleFullScreen);
		$(_getFSDocumentTarget()).on("webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange",function(event){
			_lastFSElement = _currentFSElement;
			_currentFSElement = _getFsElement(_getFSDocumentTarget()); //Use the HTML5 FS API Wrapper
			_lastFSTimestamp = new Date();
			_updateFsButtons();
		});
	};

	var _toggleFullScreen = function (){
		var myDoc = _getFSDocumentTarget();
		var myElem = _getFSElementTarget();
		if(isFullScreen()){
			_cancelFullscreenForElement(myDoc);
		} else {
			_launchFullscreenForElement(myDoc,myElem);
		}
	};

	var _launchFullscreenForElement = function(myDoc,element){
		if(element.requestFullscreen) {
			element.requestFullscreen();
		} else if(element.mozRequestFullScreen) {
			element.mozRequestFullScreen();
		} else if(element.webkitRequestFullscreen) {
			element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
			setTimeout(function(){
				if (!myDoc.webkitCurrentFullScreenElement){
					// Element.ALLOW_KEYBOARD_INPUT does not work, document is not in full screen mode
					//Fix known Safari bug
					element.webkitRequestFullScreen();
				}
			},250);
		} else if(element.msRequestFullscreen) {
			element.msRequestFullscreen();
		}
	};

	var _cancelFullscreenForElement = function(elem) {
		if(elem.exitFullscreen) {
			elem.exitFullscreen();
		} else if(elem.cancelFullScreen) {
			elem.cancelFullScreen();
		} else if(elem.mozCancelFullScreen) {
			elem.mozCancelFullScreen();
		} else if(elem.webkitExitFullscreen) {
			elem.webkitExitFullscreen();
		} else if (elem.webkitCancelFullScreen) {
			elem.webkitCancelFullScreen();
		} else if(elem.msExitFullscreen) {
			elem.msExitFullscreen();
		}
	};

	/*
	 * Wrapper for HTML5 FullScreen API. Make it cross-browser
	 */
	var isFullScreen = function(){
		if(SM.Status.getContainerType()==="OBJECT"){
			//Fix for fs in objects
			return _isBrowserInFullScreen();
		}
		return $(_getFsElement(_getFSDocumentTarget())).is("html");
	};

	var _isBrowserInFullScreen = function(){
	 	var fsElement = _getFsElement(_getFSDocumentTarget());
		return ((typeof fsElement !== "undefined")&&(fsElement !== null));
	};

	var _getFsElement = function(myDoc){
		return myDoc.fullscreenElement || myDoc.mozFullScreenElement || myDoc.webkitFullscreenElement || myDoc.msFullscreenElement;
	};

	var _getFSDocumentTarget = function(){
		return (SM.Status.getContainerType()=="OBJECT" ? window.parent.document : document);
	};

	var _getFSElementTarget = function(){
		return (SM.Status.getContainerType()==="OBJECT" ? SM.Status.getContainer().parentElement : document.documentElement);
	};

	return {
		init							: init,
		isFullScreenSupported			: isFullScreenSupported,
		canFullScreen 					: canFullScreen,
		enableFullScreen				: enableFullScreen,
		isFullScreen 					: isFullScreen
	};
    
}) (SceneMaker, jQuery);