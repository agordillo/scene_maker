VISH.ViewerAdapter = (function(V,$,undefined){

	//Viewbar
	var _showViewbar;

	//Full Screen
	var _fsButton;

	//Close button
	var _closeButton;

	//Internals
	var _initialized = false;
	//Prevent updateInterface with same params (Make ViSH Viewer more efficient)
	var _lastWidth;
	var _lastHeight;
	//Store last increases
	var _lastIncrease;
	var _lastIncreaseW;


	var init = function(options){
		if(_initialized){
			return;
		} 
		_initialized = true;

		//Init vars
		_lastWidth = -1;
		_lastHeight = -1;

		_showViewbar = true;
		_fsButton = V.FullScreen.canFullScreen();

		//Close button false by default
		_closeButton = false;

		//////////////
		//Restrictions
		/////////////

		//No fs for preview
		_fsButton = _fsButton && (!V.Status.isPreview());

		////////////////
		//Init interface
		///////////////

		$("#viewbar").show();
		
		if(V.Status.isPreview()){
			$("div#viewerpreview").show();
		}

		if(V.Status.isPreviewInsertMode()){
			$("#selectSlidesBar").show();
			$("#viewbar").css("bottom",$("#selectSlidesBar").height()+"px");
			$("#viewbar").css("border-bottom","none");
			V.SlidesSelector.init();
		}

		//Watermark
		if((options)&&(typeof options.watermarkURL == "string")){
			if((V.Status.isExternalSite())&&(!V.Status.isPreviewInsertMode())){
				$("#embedWatermark").parent().attr("href",options.watermarkURL);
				$("#embedWatermark").show();
			}
		}

		if(_closeButton){
			$("button#closeButton").show();
		}

		//Init fullscreen
		if(_fsButton){
			V.FullScreen.enableFullScreen();
			$("#page-fullscreen").show();
		} else {
			$("#page-fullscreen").hide();
		}

		//Update interface and init texts
		updateInterface();
		V.Text.init();
	};


	///////////
	// ViewBar
	///////////

	var _defaultViewbar = function(){
		return true;
	};

	///////////
	// Setup
	///////////

	var updateInterface = function(){
		var cWidth = $(window).width();
		var cHeight = $(window).height();
		if((cWidth===_lastWidth)&&(cHeight===_lastHeight)){
			return;
		}
		_lastWidth = cWidth;
		_lastHeight = cHeight;
		_setupSize();
	};


	/**
	 * Function to adapt the slides to the screen size
	 */
	var _setupSize = function(){
		var viewbarHeight = _getDesiredVieweBarHeight(_lastHeight);
		var min_margin_height = 25;
		var min_margin_width = 60;
		var height = _lastHeight - viewbarHeight;
		var width = _lastWidth;
		var finalW = 800;
		var finalH = 600;

		var finalWidthMargin;

		var aspectRatio = (width-min_margin_width)/(height-min_margin_height);
		var slidesRatio = 4/3;
		if(aspectRatio > slidesRatio){
			finalH = height - min_margin_height;
			finalW = finalH*slidesRatio;
			var widthMargin = (width - finalW);
			if(widthMargin < min_margin_width){
				finalWidthMargin = min_margin_width;
				var marginWidthToAdd = min_margin_width - widthMargin;
				finalW = finalW - marginWidthToAdd;
			} else {
				finalWidthMargin = widthMargin;
			}
		}	else {
			finalW = width - min_margin_width;
			finalH = finalW/slidesRatio;
			finalWidthMargin = min_margin_width;
			var heightMargin = (height - finalH);
			if(heightMargin < min_margin_height){
				var marginHeightToAdd = min_margin_height - heightMargin;
				finalH = finalH - marginHeightToAdd;
			}
		}

		//finalWidthMargin: margin with added 
		$(".vish_arrow").width(finalWidthMargin/2*0.9);

		//Viewbar
		$("#viewbar").height(viewbarHeight);
		
		//resize slides
		var topSlides = $(".slides > article");
		var subSlides = $(".slides > article > article");
		var allSlides = $(".slides article");
		$(allSlides).css("height", finalH);
		$(allSlides).css("width", finalW);

		//margin-top and margin-left half of the height and width
		var marginTop = finalH/2 + viewbarHeight/2;
		var marginLeft = finalW/2;
		$(topSlides).css("margin-top", "-" + marginTop + "px");
		$(subSlides).css("margin-top", "-" + finalH/2 + "px");
		$(allSlides).css("margin-left", "-" + marginLeft + "px");
		
		var increase = finalH/600;
		var increaseW = finalW/800;

		_lastIncrease = increase;
		_lastIncreaseW = increaseW;

		//Paddings
		var paddingTopAndBottom = 3/100*finalW;	//3%
		var paddingLeftAndRight = 5/100*finalW;	//5%
		$(allSlides).css("padding-left",paddingLeftAndRight);
		$(allSlides).css("padding-right",paddingLeftAndRight); 
		$(allSlides).css("padding-top",	paddingTopAndBottom);
		$(allSlides).css("padding-bottom",paddingTopAndBottom);

		//Close button for subslides
		var _closeButtonDimension = 23;
		if(increase <= 1){
			_closeButtonDimension = _closeButtonDimension*getPonderatedIncrease(increase,0.7);
		} else {
			_closeButtonDimension = _closeButtonDimension*getPonderatedIncrease(increase,0.2);
		}
		$("div.close_subslide").css("width",_closeButtonDimension+"px");
		$("div.close_subslide").css("height",_closeButtonDimension+"px");

		//Fs button
		$("#page-fullscreen").width($("#page-fullscreen").height());

		updateFancyboxAfterSetupSize(increase,increaseW);

		//Texts callbacks
		V.Text.aftersetupSize(increase,increaseW);

		//Object callbacks
		V.ObjectPlayer.aftersetupSize(increase,increaseW);

		//Slidesets
		V.Slideset.afterSetupSize(increase,increaseW);
	};

	var _getDesiredVieweBarHeight = function(windowHeight){
		var minimumViewBarHeight = 26;
		var maxViewBarHeight = 40;
		var estimatedIncrease = windowHeight/600;
		var viewBarHeight = 40 * getPonderatedIncrease(estimatedIncrease,0.7);
		return Math.min(Math.max(viewBarHeight,minimumViewBarHeight),maxViewBarHeight);
	};

	/**
	 * Fancybox resizing. If a fancybox is opened, resize it
	 */
	var updateFancyboxAfterSetupSize = function(increase,increaseW){
		var fOverlay = $("#fancybox-overlay");
		if(($(fOverlay).length<1)||(!$(fOverlay).is(":visible"))){
			return;
		}

		increase = (typeof increase == "number") ? increase : V.ViewerAdapter.getLastIncrease()[0];

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
			_closeButtonDimension = _closeButtonDimension*getPonderatedIncrease(increase,0.7);
		} else {
			_closeButtonDimension = _closeButtonDimension*getPonderatedIncrease(increase,0.2);
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

	var getDimensionsForResizedButton = function(increase,originalWidth,aspectRatio){
		var originalWidth = originalWidth || 23;
		var aspectRatio = aspectRatio || 1;

		var _buttonWidth = originalWidth;
		if(increase <= 1){
			_buttonWidth = _buttonWidth*getPonderatedIncrease(increase,0.7);
		} else {
			_buttonWidth = _buttonWidth*getPonderatedIncrease(increase,0.2);
		}

		return {width: _buttonWidth, height: _buttonWidth/aspectRatio};
	}

	var getLastIncrease = function(){
		return [_lastIncrease,_lastIncreaseW];
	};

	var getPonderatedIncrease = function(increase,pFactor){
		var diff = (increase-1)*pFactor;
		return 1+diff;
	};
	
	return {
		init 							: init,
		updateInterface 				: updateInterface,
		updateFancyboxAfterSetupSize	: updateFancyboxAfterSetupSize,
		getDimensionsForResizedButton	: getDimensionsForResizedButton,
		getPonderatedIncrease 			: getPonderatedIncrease,
		getLastIncrease					: getLastIncrease
	};

}) (VISH, jQuery);