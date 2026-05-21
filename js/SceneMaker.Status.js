SceneMaker.Status = (function(SM,$,undefined){
	var _features;
	var _isEmbed;
	var _container;
	var _containerType;
	var _isExternalDomain;
	var _isPreview;
	var _protocol;
	
	var init = function(){
		_fillFeatures();
		_checkEmbed();
		_checkDomain();
		_checkContainer();
		_checkProtocol();
		_checkPreview();
	};

	var _fillFeatures = function(){
		_features = {};

		//Fullscreen support
		_features.fullscreen = SM.FullScreen.isFullScreenSupported();
		
		//Touchscreen detection
		_features.touchScreen = !!('ontouchstart' in window);

		//LocalStorage detection
		_features.localStorage = _checkLocalStorageSupport();

		//Session management
		_features.history = ((typeof history === "object")&&(typeof history.back === "function")&&(typeof history.go === "function"));

		if((_features.history)&&(typeof history.pushState == "function")){
			_features.historypushState = true;
		} else {
			_features.historypushState = false;
		}

		//FileReader API
		if (window.File && window.FileReader && window.FileList && window.Blob) {
			_features.reader = true;
		} else {
			_features.reader = false;
		}

		//PDF native reader
		_features.pdfReader = false;
		if((typeof navigator.mimeTypes == "object")&&("application/pdf" in navigator.mimeTypes)){
			_features.pdfReader = true;
		}

		return _features;
	};

	var _checkLocalStorageSupport = function(){
		var LSSupported = (typeof(Storage)!=="undefined");
		if(LSSupported){
			//Check if there is no security restrictions
			try {
				localStorage.setItem("myKey","myKeyValue");
				localStorage.getItem("myKey");
				localStorage.removeItem("myKey");
				return true;
			} catch(e){
				return false;
			}
		} else {
			return false;
		}
	};

	var _checkEmbed = function(){
		_isEmbed = ((window.location != window.parent.location) ? true : false);
		return _isEmbed;
	};

	var _checkDomain = function(){
		_isExternalDomain = false;
		if(_checkEmbed()){
			try {
				var parent = window.parent;
				while(parent!=window.top){
					if(typeof parent.location.href === "undefined"){
						_isExternalDomain = true;
						break;
					} else {
						parent = parent.parent;
					}
				}
				if(typeof window.top.location.href === "undefined"){
					_isExternalDomain = true;
				}
			} catch(e) {
				_isExternalDomain = true;
			}
		}
		return _isExternalDomain;
	};

	var _checkContainer = function(){
		_container = undefined;
		_containerType = "undefined";
		if((_isEmbed)&&(!_isExternalDomain)){
			try{
				switch(window.frameElement.tagName){
					case "OBJECT":
					case "IFRAME":
					default:
						_containerType = window.frameElement.tagName;
						_container = window.frameElement;
				}
			} catch (e){}
		}
	};

	var _checkProtocol = function(){
		var protocol;
		try {
			protocol = document.location.protocol;
		} catch(e){}

		if(typeof protocol == "string"){
			var protocolMatch = protocol.match(/[\w]+/);
			if((protocolMatch instanceof Array)&&(typeof protocolMatch[0] == "string")){
				protocol = protocolMatch[0];
			} else {
				protocol = undefined;
			}
		}

		if(typeof protocol == "string"){
			_protocol = protocol;
		} else {
			_protocol = "unknown";
		}
	};

	var _checkPreview = function(){
		var options = SM.Utils.getOptions();
		if(typeof options["preview"] === "boolean"){
			_isPreview = options["preview"];
		} else {
			_isPreview = false;
		}
	};


	//////////////////////////
	// Getters and Setters
	//////////////////////////

	var getFeatures = function(){
		return _features;
	};

	var isEmbed = function(){
		return _isEmbed;
	};

	var getContainer = function(){
		return _container;
	};

	var getContainerType = function(){
		return _containerType;
	};

	var isExternalDomain = function(){
		return _isExternalDomain;
	};

	var getProtocol = function(){
		if(typeof _protocol == "undefined"){
			_checkProtocol();
		}
		return _protocol;
	};

	var isPreview = function(){
		return _isPreview;
	};

	return {
		init						: init,
		getFeatures					: getFeatures,
		isExternalDomain 			: isExternalDomain,
		isEmbed						: isEmbed,
		getContainer				: getContainer,
		getContainerType			: getContainerType,
		getProtocol					: getProtocol,
		isPreview 					: isPreview
	};

}) (SceneMaker, jQuery);
