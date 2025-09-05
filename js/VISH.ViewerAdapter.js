VISH.ViewerAdapter = (function(V,$,undefined){
	var _initialized = false;
	var _fullscreenButton;
	var _lastWidth;
	var _lastHeight;
	var _lastSlideWidth;
	var _lastSlideHeight;
	var _sceneAspectRatioString;
	var _sceneAspectRatio;
	var _referenceSlideWith;
	var _referenceSlideHeight;

	var init = function(options){
		if(_initialized){
			return;
		} 
		_initialized = true;

		_fullscreenButton = V.FullScreen.canFullScreen();
		//No fs for preview
		_fullscreenButton = _fullscreenButton && (!V.Status.isPreview());

		$("#viewbar").show();
		
		if(V.Status.isPreview()){
			$("div#viewerpreview").show();
		}

		//Init fullscreen
		if(_fullscreenButton){
			V.FullScreen.enableFullScreen();
			$("#page-fullscreen").show();
		} else {
			$("#page-fullscreen").hide();
		}

		//Update interface and init texts
		updateInterface();
		V.Text.init();
	};

	var applyAspectRatio = function(newAspectRatio){
		if((typeof newAspectRatio !== "string")||(["4:3","16:9"].indexOf(newAspectRatio)===-1)){
			return;
		}
		if(_sceneAspectRatioString === newAspectRatio){
			return;
		}
		_sceneAspectRatioString = newAspectRatio;
		$("body").attr("aspectRatio", newAspectRatio);

		if(newAspectRatio === "16:9"){
			_sceneAspectRatio = 16/9;
			_referenceSlideWidth = 1024;
			_referenceSlideHeight = 576;
		} else {
			_sceneAspectRatio = 4/3;
			_referenceSlideWidth = 800;
			_referenceSlideHeight = 600;
		}
	};

	var getAspectRatio = function(){
		return _sceneAspectRatioString;
	};

	var updateInterface = function(){
		if(typeof _sceneAspectRatio === "undefined"){
			return;
		}
		var cWidth = $(window).width();
		var cHeight = $(window).height();
		if((cWidth===_lastWidth)&&(cHeight===_lastHeight)){
			return;
		}
		_lastWidth = cWidth;
		_lastHeight = cHeight;
		_setupSize();
	};

	var _setupSize = function(){
		var finalSlideWidth;
		var finalSlideHeight;

		//Constants
		var min_margin_height = 25;
		var min_margin_width = 10;

		//Calculations
		var viewbarHeight = _getDesiredVieweBarHeight(_lastHeight);
		var height = _lastHeight - viewbarHeight;
		var width = _lastWidth;

		var aspectRatio = (width-min_margin_width)/(height-min_margin_height);
		if(aspectRatio > _sceneAspectRatio){
			finalSlideHeight = height - min_margin_height;
			finalSlideWidth = finalSlideHeight*_sceneAspectRatio;
			var widthMargin = (width - finalSlideWidth);
			if(widthMargin < min_margin_width){
				var marginWidthToAdd = min_margin_width - widthMargin;
				finalSlideWidth = finalSlideWidth - marginWidthToAdd;
			}
		} else {
			finalSlideWidth = width - min_margin_width;
			finalSlideHeight = finalSlideWidth/_sceneAspectRatio;
			var heightMargin = (height - finalSlideHeight);
			if(heightMargin < min_margin_height){
				var marginHeightToAdd = min_margin_height - heightMargin;
				finalSlideHeight = finalSlideHeight - marginHeightToAdd;
			}
		}

		if(typeof _lastSlideHeight !== "number"){
			_lastSlideHeight = _referenceSlideHeight;
		}
		if(typeof _lastSlideWidth !== "number"){
			_lastSlideWidth = _referenceSlideWidth;
		}
		var increase = finalSlideHeight/_lastSlideHeight;
		//var increaseW = finalSlideWidth/_lastSlideWidth; //increaseW is the same as increase
		_lastSlideHeight = finalSlideHeight;
		_lastSlideWidth = finalSlideWidth;

		//Update UI

		//Viewbar
		$("#viewbar").height(viewbarHeight);
		
		//Resize slides
		var screens = $(".slides > article");
		var views = $(".slides > article > article");
		var allSlides = $(".slides article");
		$(allSlides).css("height", finalSlideHeight);
		$(allSlides).css("width", finalSlideWidth);

		//margin-top and margin-left half of the height and width
		var marginTop = finalSlideHeight/2 + viewbarHeight/2;
		var marginLeft = finalSlideWidth/2;
		$(screens).css("margin-top", "-" + marginTop + "px");
		$(views).css("margin-top", "-" + finalSlideHeight/2 + "px");
		$(allSlides).css("margin-left", "-" + marginLeft + "px");
		
		//Paddings
		var paddingTopAndBottom = 3/100*finalSlideWidth;	//3%
		var paddingLeftAndRight = 5/100*finalSlideWidth;	//5%
		$(allSlides).css("padding-left",paddingLeftAndRight);
		$(allSlides).css("padding-right",paddingLeftAndRight); 
		$(allSlides).css("padding-top",	paddingTopAndBottom);
		$(allSlides).css("padding-bottom",paddingTopAndBottom);

		//Close button for views
		var _closeButtonDimension = 23;
		if(increase <= 1){
			_closeButtonDimension = _closeButtonDimension*_getPonderatedIncrease(increase,0.7);
		} else {
			_closeButtonDimension = _closeButtonDimension*_getPonderatedIncrease(increase,0.2);
		}
		$("div.close_view").css("width",_closeButtonDimension+"px");
		$("div.close_view").css("height",_closeButtonDimension+"px");

		//Fs button
		$("#page-fullscreen").width($("#page-fullscreen").height());

		_updateFancyboxAfterSetupSize(increase);
		V.Text.aftersetupSize(increase);
		V.ObjectPlayer.aftersetupSize(increase);
		V.Screen.afterSetupSize(increase);
	};

	var _getDesiredVieweBarHeight = function(windowHeight){
		var minimumViewBarHeight = 26;
		var maxViewBarHeight = 40;
		var estimatedIncrease = windowHeight/_referenceSlideHeight;
		var viewBarHeight = 40 * _getPonderatedIncrease(estimatedIncrease,0.7);
		return Math.min(Math.max(viewBarHeight,minimumViewBarHeight),maxViewBarHeight);
	};

	var _updateFancyboxAfterSetupSize = function(increase){
		var fOverlay = $("#fancybox-overlay");
		if(($(fOverlay).length<1)||(!$(fOverlay).is(":visible"))){
			return;
		}

		var fwrap = $("#fancybox-wrap");
		var fcontent = $("#fancybox-content");
		var fccontentDivs = $("#" + $(fcontent).attr("id") + " > div");
		
		var currentSlide = $(".current");
		var paddingTop = $(currentSlide).cssNumber("padding-top");
		var paddingLeft = $(currentSlide).cssNumber("padding-left");
		var paddingRight = $(currentSlide).cssNumber("padding-right");
		var offset = $(currentSlide).offset();
		
		var _closeButtonDimension = 23;
		if(increase <= 1){
			_closeButtonDimension = _closeButtonDimension*_getPonderatedIncrease(increase,0.7);
		} else {
			_closeButtonDimension = _closeButtonDimension*_getPonderatedIncrease(increase,0.2);
		}
		var fcClose = $("#fancybox-close");
		$(fcClose).width(_closeButtonDimension + "px");
		$(fcClose).height(_closeButtonDimension + "px");
		$(fcClose).css("padding","10px");
		$(fcClose).css("padding-left","4px");
		
		$(fwrap).css("margin-top", "0px");
		$(fwrap).css("margin-left", "0px");
		$(fwrap).width($(currentSlide).width()+paddingLeft+paddingRight);
		$(fwrap).height($(currentSlide).height()+2*paddingTop);
		$(fwrap).css("top", offset.top + "px");  
		$(fwrap).css("left", offset.left + "px");

		$(fcontent).width("100%");
		$(fcontent).height("100%");
		$(fccontentDivs).width("100%");
		$(fccontentDivs).height("100%");
	};

	var _getPonderatedIncrease = function(increase,pFactor){
		var diff = (increase-1)*pFactor;
		return 1+diff;
	};
	
	return {
		init 							: init,
		getAspectRatio					: getAspectRatio,
		applyAspectRatio				: applyAspectRatio,
		updateInterface 				: updateInterface
	};

}) (VISH, jQuery);