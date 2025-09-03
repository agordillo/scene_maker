VISH.Editor.Screen = (function(V,$,undefined){

	var initialized = false;
	var currentEditingMode = "NONE"; //Can be "NONE", HOTSPOT" or "ZONE".
	var _hiddenLinkToInitHotspotSettings;
	var screenData;
	var currentHotspot;
	var currentSubslide;

	var init = function(){
		screenData = {};

		//Hotspot Settings
		_hiddenLinkToInitHotspotSettings = $('<a href="#hotspotSettings_fancybox" style="display:none"></a>');
		$(_hiddenLinkToInitHotspotSettings).fancybox({
			'autoDimensions' : false,
			'height': 600,
			'width': 800,
			'scrolling': 'no',
			'showCloseButton': false,
			'padding' : 0,
			"onStart"  : function(data){
				_onStartHotspotSettingsFancybox();
			},
			"onComplete" : function(data){
			},
			"onClosed"  : function(data){
			}
		});

		//Fill action template with current puzzles
		var nPuzzles = V.Editor.getOptions().nPuzzles;

		if((typeof nPuzzles === "number")&&(nPuzzles > 0)){
			var currentOptionsPuzzles = [];
			for(var inp = 0; inp < nPuzzles; inp++){
				var nPuzzle = (inp+1);
				currentOptionsPuzzles.push({
					value: nPuzzle,
					text: (V.I18n.getTrans("i.PuzzleOption", {number: nPuzzle}))
				});
			}
		}

		$("div.hotspotActionWrapperTemplate div.hotspotActionParamsPuzzle select").each(function() {
			var $select = $(this);
			$select.empty();
			$select.append($('<option>', { value: "none", text: V.I18n.getTrans("i.Unspecified") }))
			$.each(currentOptionsPuzzles, function(_, opt) {
				$select.append($("<option>", { value: opt.value, text: opt.text }));
			});
		});
	};

	/*
	 * Add new screen to the scene
	 */
	var addScreen = function(){
		var options = {};
		options.slideNumber = V.Slides.getSlidesQuantity()+1;
		var slidesetId = V.Utils.getId("article");
		var slide = getDummy(slidesetId,options);
		V.Editor.Slides.addSlide(slide);
		$.fancybox.close();
	};

	/*
	* Draw
	*/
	var draw = function(screenJSON,scaffoldDOM){
		if(screenJSON){
			if((typeof screenJSON.background === "string")&&(screenJSON.background !== "none")){
				onBackgroundSelected(V.Utils.getSrcFromCSS(screenJSON.background));
			};
			//Draw hotspots
			if (Array.isArray(screenJSON.hotspots)) {
				$(screenJSON.hotspots).each(function(index,hotspot){
					V.Utils.registerId(hotspot.id);

					//Transform dimensions from percentage to absolute numbers for a container with dimensions 800x600.
					var hotspotX = hotspot.x*800/100;
					var hotspotY = hotspot.y*600/100;
					var hotspotWidth = hotspot.width*800/100;
					var hotspotHeight = hotspot.height*600/100;

					_drawHotspot(screenJSON.id,hotspot.id,hotspotX,hotspotY,hotspot.image,hotspot.lockAspectRatio,hotspotWidth,hotspotHeight,hotspot.rotationAngle);
					if (Array.isArray(hotspot.actions)&&hotspot.actions.length>0) {
						screenData[screenJSON.id].hotspots[hotspot.id].actions = hotspot.actions;
					}
				});
			}
		}
	};

   /*
	* Tools: Hotspots and zones
	*/
	var addHotspot = function(){
		if(currentEditingMode === "HOTSPOT"){
			_disableEditingMode("HOTSPOT");
			currentEditingMode = "NONE";
		} else {
			currentEditingMode = "HOTSPOT";
			_enableEditingMode("HOTSPOT");
		}
	};

	var addZone = function(){
		if(currentEditingMode === "ZONE"){
			_disableEditingMode("ZONE");
			currentEditingMode = "NONE";
		} else {
			currentEditingMode = "ZONE";
			_enableEditingMode("ZONE");
		}
	};

	var _enableEditingMode = function(mode){
		switch(mode){
			case "HOTSPOT":
				_disableEditingMode("ZONE");
				$("#slides_panel").addClass("hotspot_active");
				break;
			case "ZONE":
				_disableEditingMode("HOTSPOT");
				$("#slides_panel").addClass("zone_active");
				break;
			case "NONE":
				_disableEditingMode("HOTSPOT");
				_disableEditingMode("ZONE");
				break;
		}
	};

	var _disableEditingMode = function(mode){
		switch(mode){
			case "HOTSPOT":
				$("#slides_panel").removeClass("hotspot_active");
				currentHotspot = undefined;
				break;
			case "ZONE":
				$("#slides_panel").removeClass("zone_active");
				break;
			default:
				break;
		}
	};

	var onClick = function(event){
		var $target = $(event.target);
		if(currentEditingMode !== "NONE"){
			if ($target.closest('article[type="flashcard"]').length === 0) {
				//Click outside a screen
				currentEditingMode = "NONE";
				_enableEditingMode("NONE");
			} else {
				//Click inside a screen
				switch(currentEditingMode){
					case "HOTSPOT":
						_onClickInHotspotMode(event);
						break;
					case "ZONE":
						_onClickInZoneMode(event);
						break;
					default:
						break;
				}
			}
		} else {
			if ($target.hasClass('hotspot')){
				_onSelectHotspot($target);
			}
		}
	};


	/////
	// Hotspots
	/////

	var _onClickInHotspotMode = function(event){
		event.preventDefault();
		event.stopPropagation();

		var screen = V.Slides.getCurrentSlide();
		var screenId = $(screen).attr("id");
		var hotspotId = V.Utils.getId("hotspot-");
		var hotspotSize = 42;
		var rect = screen.getBoundingClientRect();
	    var x = event.clientX - rect.left - hotspotSize/2;
	    var y = event.clientY - rect.top - hotspotSize/2;
		
		_drawHotspot(screenId,hotspotId,x,y);

		currentEditingMode = "NONE";
		_enableEditingMode("NONE");
	};

	var _drawHotspot = function(screenId,hotspotId,x,y,imgURL,lockAspectRatio,width,height,rotationAngle){
		if(typeof imgURL !== "string"){
			imgURL = V.Slideset.getDefaultHotspotImg();
		}
		if(typeof lockAspectRatio !== "boolean"){
			lockAspectRatio = true;
		}
		if(typeof width !== "number"){
			width = 42;
		}
		if(typeof height !== "number"){
			height = 42;
		}

		var rotationAngle = parseFloat(rotationAngle);
		if (typeof rotationAngle !== "number" || isNaN(rotationAngle) || rotationAngle < 0 || rotationAngle > 360) {
			rotationAngle = 0;
		}

		var screen = $("#"+screenId);
		var $hotspot = $('<img>', {
			src: imgURL,
			class: 'hotspot',
			id: hotspotId,
			rotationAngle: rotationAngle,
			css: {
				position: 'absolute',
				left: x,
				top: y,
				width: (width + "px"),
				height: (height + "px"),
				transform: "rotate(" + rotationAngle + "deg)"
			}
		}).appendTo(screen);
		_validateHotspotPosition($hotspot);

		if(typeof screenData[screenId] === "undefined"){
			screenData[screenId] = {
				hotspots: {},
				zones: {}
			};
		}
		screenData[screenId].hotspots[hotspotId] = {};
		screenData[screenId].hotspots[hotspotId].lockAspectRatio = lockAspectRatio;
		
		_enableDraggableHotspot($hotspot);
	};

	var _enableDraggableHotspot = function($hotspot){
		$hotspot.draggable({
			start: function(event, ui) {
				_onSelectHotspot($hotspot);
			},
			stop: function(event, ui) {
				_validateHotspotPosition($hotspot);
			}
		});
	};

	var refreshDraggables = function(screen){
		//Refresh hotspots
		$(screen).find('img.hotspot').each(function() {
			var $hotspot = $(this);
			_enableDraggableHotspot($hotspot);
		});
	};

	var _validateHotspotPosition = function($hotspot, margin = 4) {
		const $screen = $hotspot.parent();

		if (!$screen.is('article[type="flashcard"]')) {
		  return;
		}

		if (!_fullyInside($screen, $hotspot, margin)) {
			_moveInside($screen, $hotspot);
		}
	};

	var _fullyInside = function($container, $el, margin = 0) {
		const cw = $container.innerWidth();
		const ch = $container.innerHeight();
		const ew = $el.outerWidth();
		const eh = $el.outerHeight();
		const pos = $el.position();

		return (
			pos.left >= -margin &&
			pos.top  >= -margin &&
			(pos.left + ew) <= (cw + margin) &&
			(pos.top  + eh) <= (ch + margin)
		);
	};

	var _moveInside = function($container, $el, margin = 0) {
		const cw = $container.innerWidth();
		const ch = $container.innerHeight();
		const ew = $el.outerWidth();
		const eh = $el.outerHeight();
		let { left, top } = $el.position();

		left = Math.max(margin, Math.min(left, cw - ew - margin));
		top  = Math.max(margin, Math.min(top,  ch - eh - margin));

		//$el.css({ left, top });
		$el.stop(true).animate({ left, top }, 1000);
	};

	var _onSelectHotspot = function($hotspot){
		currentHotspot = $hotspot;
		V.Editor.Tools.loadToolsForElement("hotspot");
	};

	var showHotspotSettings = function(){
		$(_hiddenLinkToInitHotspotSettings).trigger("click");
	};

	var _onStartHotspotSettingsFancybox = function(){
		var screenId = $(V.Slides.getCurrentSlide()).attr("id");
		var $hotspot = $(currentHotspot);
		var hotspotId = $hotspot.attr("id");
		var hotspotSettings = screenData[screenId].hotspots[hotspotId];

		//ID
		$("#hotspotId").val(hotspotId);

		//Image
		//Reset gallery
		$("#hotspotImageGallery img").removeClass("selected");
		var hotspotImageSource = $hotspot.attr("src");
		//Check if image belongs to gallery
		var imgGallery = $("#hotspotImageGallery").find("img[src='" + hotspotImageSource + "']")[0];
		if(typeof imgGallery === "undefined"){
			//Image does not belong to the gallery
			$("#hotspotImageURL").val(hotspotImageSource);
			$("#hotspotImageSource").val("url").trigger("change");
		} else {
			$(imgGallery).addClass("selected");
			$("#hotspotImageSource").val("gallery").trigger("change");
		}

		//Size
		if(typeof screenData[screenId].hotspots[hotspotId].lockAspectRatio === "boolean"){
			$("#hotspotLockAspectRatio").prop("checked", screenData[screenId].hotspots[hotspotId].lockAspectRatio);
		}
		
		var hotspotWidth = $hotspot.width();
		var hotspotHeight = $hotspot.height();
		var hotspotAspectRatio = Math.round((hotspotWidth/hotspotHeight) * 100) / 100;
		$("#hotspotSizeWidth").val(hotspotWidth);
		$("#hotspotSizeHeight").val(hotspotHeight);
		$("#hotspotAspectRatio").val(hotspotAspectRatio);
		
		//Rotation
		var rotationAngle = $hotspot.attr("rotationAngle");
		if (!isNaN(rotationAngle) && rotationAngle >= 0 && rotationAngle <= 360) {
			$("#hotspotRotation").val(rotationAngle);
		} else {
			$("#hotspotRotation").val(0);
		}
		
		//Actions

		//Remove prior actions
		$("div.hotspotActionWrapper:not(.hotspotActionWrapperTemplate)").remove();

		//Fill action template with current screens
		var currentOptionsScreens = [];
		$('article[type="flashcard"]').each(function() {
		  var $screen = $(this);
		  currentOptionsScreens.push({
		    value: $screen.attr('id'),
		    text: (V.I18n.getTrans("i.ScreenOption", {number: $screen.attr('slidenumber')}))
		  });
		});

		$("div.hotspotActionParamsScreen select").each(function() {
			var $select = $(this);
			$select.empty();
			$select.append($('<option>', { value: "none", text: V.I18n.getTrans("i.Unspecified") }))
			$.each(currentOptionsScreens, function(_, opt) {
				$select.append($("<option>", { value: opt.value, text: opt.text }));
			});
		});

		$("div.hotspotActionParamsScreenReplacement select").each(function() {
			var $select = $(this);
			$select.empty();
			$select.append($('<option>', { value: "none", text: V.I18n.getTrans("i.Unspecified") }))
			$.each(currentOptionsScreens, function(_, opt) {
				$select.append($("<option>", { value: opt.value, text: opt.text }));
			});
		});

		//Fill action template with current views
		var currentOptionsViews = [];
		$(V.Slides.getCurrentSlide()).children("article").each(function() {
		  var $view = $(this);
		  currentOptionsViews.push({
		    value: $view.attr('id'),
		    text: (V.I18n.getTrans("i.ViewOption", {number: $view.attr('slidenumber')}))
		  });
		});

		$("div.hotspotActionParamsView select").each(function() {
			var $select = $(this);
			$select.empty();
			$select.append($('<option>', { value: "none", text: V.I18n.getTrans("i.Unspecified") }))
			$.each(currentOptionsViews, function(_, opt) {
				$select.append($("<option>", { value: opt.value, text: opt.text }));
			});
		});

		//Fill action template with current element ids (hotspots and zones)
		var currentOptionsElementIds = [];
		//Hotspots
		$('img.hotspot').each(function() {
		  var $hotspot = $(this);
		  currentOptionsElementIds.push({
		    value: $hotspot.attr('id'),
		    text: $hotspot.attr('id')
		  });
		});

		$("div.hotspotActionParamsElementId select").each(function() {
			var $select = $(this);
			$select.empty();
			$select.append($('<option>', { value: "none", text: V.I18n.getTrans("i.Unspecified") }))
			$.each(currentOptionsElementIds, function(_, opt) {
				$select.append($("<option>", { value: opt.value, text: opt.text }));
			});
		});

		//Fill properties with hotspotSettings
		if (Array.isArray(hotspotSettings.actions) && hotspotSettings.actions.length > 0) {
			for(var i=0; i<hotspotSettings.actions.length; i++){
				var hotspotAction = hotspotSettings.actions[i];
				if((typeof hotspotAction.actionType === "string")&&(hotspotAction.actionType !== "none")){
					var $actionWrapper = onHotspotNewAction();
					$actionWrapper.find("select.hotspotActionType").val(hotspotAction.actionType).trigger('change');
					if(typeof hotspotAction.actionParams !== "undefined"){
						if(typeof hotspotAction.actionParams.screen === "string"){
							var $actionParamsScreenSelect = $actionWrapper.find("div.hotspotActionParamsScreen select");
							$actionParamsScreenSelect.val(hotspotAction.actionParams.screen);
						}
						if(typeof hotspotAction.actionParams.screenReplacement === "string"){
							var $actionParamsScreenSelectReplacement = $actionWrapper.find("div.hotspotActionParamsScreenReplacement select");
							$actionParamsScreenSelectReplacement.val(hotspotAction.actionParams.screenReplacement);
						}
						if(typeof hotspotAction.actionParams.view === "string"){
							var $actionParamsViewSelect = $actionWrapper.find("div.hotspotActionParamsView select");
							$actionParamsViewSelect.val(hotspotAction.actionParams.view);
						}
						if(typeof hotspotAction.actionParams.elementId === "string"){
							var $actionParamsElementIdSelect = $actionWrapper.find("div.hotspotActionParamsElementId select");
							$actionParamsElementIdSelect.val(hotspotAction.actionParams.elementId);
						}
						if(typeof hotspotAction.actionParams.puzzle === "string"){
							var $actionParamsPuzzleSelect = $actionWrapper.find("div.hotspotActionParamsPuzzle select");
							$actionParamsPuzzleSelect.val(hotspotAction.actionParams.puzzle);
						}
					}
				}
			}	
		}
	};

	var onHotspotImageSourceChange = function(event){
		var option = event.target.value;
		if(option === "gallery"){
			$("#hotspotImageGallery").show();
			$("#hotspotImageURLWrapper").hide();
			$("#hotspotImageURL").val("");
			checkHotspotImageURLPreview();
		} else if(option === "url"){
			$("#hotspotImageGallery").hide();
			$("#hotspotImageURLWrapper").show();
			checkHotspotImageURLPreview();
		}
	};

	var checkHotspotImageURLPreview = function(){
		var $hotspotImageURLPreviewWrapper = $("#hotspotImageURLPreviewWrapper");
		var imgUrl = $("#hotspotImageURL").val();
		if((typeof imgUrl === "string")&&(imgUrl.trim() !== "")){
			$hotspotImageURLPreviewWrapper.html("<img src='" + imgUrl + "'>").show();
		} else {
			$hotspotImageURLPreviewWrapper.html("").hide();
		}
	};

	var onClickHotspotImageGallery = function(event){
		var $img = $(event.target);
		$img.siblings("img").removeClass("selected");
		$img.addClass("selected");
	};


	var onInputHotspotSizeWidth = function(event){
		var lockAspectRatio = $("#hotspotLockAspectRatio").prop("checked");
		if(lockAspectRatio){
			var aspectRatio = parseFloat($("#hotspotAspectRatio").val());
			$("#hotspotSizeHeight").val($("#hotspotSizeWidth").val()/aspectRatio);
		}
	};

	var onInputHotspotSizeHeight = function(event){
		var lockAspectRatio = $("#hotspotLockAspectRatio").prop("checked");
		if(lockAspectRatio){
			var aspectRatio = parseFloat($("#hotspotAspectRatio").val());
			$("#hotspotSizeWidth").val($("#hotspotSizeHeight").val()*aspectRatio);
		}
	};

	var onHotspotNewAction = function(){
		var $actionWrapperDiv = $(".hotspotActionWrapperTemplate").clone().removeClass("hotspotActionWrapperTemplate").show();
		$("#hotspotNewAction").closest(".new_hotspot_settings_field").append($actionWrapperDiv);
		return $actionWrapperDiv;
	};

	var onHotspotDeleteAction = function(event){
		$(event.target).closest(".hotspotActionWrapper").remove();
	};

	var onHotspotActionChange = function(event){
		var option = event.target.value;
		var $actionWrapperDiv = $(event.target).closest("div.hotspotActionWrapper");
		var $selectScreenWrapper = $actionWrapperDiv.find("div.hotspotActionParamsScreen");
		var $selectScreen = $selectScreenWrapper.find("select");
		var $selectScreenReplacementWrapper = $actionWrapperDiv.find("div.hotspotActionParamsScreenReplacement");
		var $selectScreenReplacement = $selectScreenReplacementWrapper.find("select");
		var $selectViewWrapper = $actionWrapperDiv.find("div.hotspotActionParamsView");
		var $selectView = $selectViewWrapper.find("select");
		var $selectElementIdWrapper = $actionWrapperDiv.find("div.hotspotActionParamsElementId");
		var $selectElementId = $selectElementIdWrapper.find("select");
		var $selectPuzzleWrapper = $actionWrapperDiv.find("div.hotspotActionParamsPuzzle");
		var $selectPuzzle = $selectPuzzleWrapper.find("select");
		
		if((option === "goToScreen")||(option === "changeScreen")){
			$selectScreen.prop("selectedIndex", 0);
			$selectScreenWrapper.show();
		} else {
			$selectScreenWrapper.hide();
		}
		if(option === "changeScreen"){
			$selectScreenReplacement.prop("selectedIndex", 0);
			$selectScreenReplacementWrapper.show();
		} else {
			$selectScreenReplacementWrapper.hide();
		}
		if(option === "openView"){
			$selectView.prop("selectedIndex", 0);
			$selectViewWrapper.show();
		} else {
			$selectViewWrapper.hide();
		}
		if(option === "removeElement"){
			$selectElementId.prop("selectedIndex", 0);
			$selectElementIdWrapper.show();
		} else {
			$selectElementIdWrapper.hide();
		}
		if(option === "solvePuzzle"){
			$selectPuzzle.prop("selectedIndex", 0);
			$selectPuzzleWrapper.show();
		} else {
			$selectPuzzleWrapper.hide();
		}
	};

	var onHotspotSettingsDone = function(event){
		var screenId = $(V.Slides.getCurrentSlide()).attr("id");
		var $hotspot = $(currentHotspot);
		var hotspotId = $hotspot.attr("id");
		var hotspotSettings = {};

		//Hotspot image
		var hotspotImg;
		switch($("#hotspotImageSource").val()){
			case "gallery":
				var $selectedGalleryImg = $("#hotspotImageGallery img.selected");
				if ($selectedGalleryImg.length) {
					hotspotImg = $selectedGalleryImg.attr("src");
				}
				break;
			case "url":
				hotspotImg = $("#hotspotImageURL").val();
				break;
			default:
				break;
		}
		if(typeof hotspotImg !== "string"){
			hotspotImg = V.Slideset.getDefaultHotspotImg();
		}
		$hotspot.attr("src", hotspotImg);

		//Hotspot size
		hotspotSettings.lockAspectRatio = $("#hotspotLockAspectRatio").prop("checked");
		var hotspotWidth = $("#hotspotSizeWidth").val();
		var hotspotHeight = $("#hotspotSizeHeight").val();
		if(hotspotWidth > 0){
			$hotspot.width(hotspotWidth);
		}
		if(hotspotHeight > 0){
			$hotspot.height(hotspotHeight);
		}

		//Hotspot rotation
		var rotationAngle = parseFloat($("#hotspotRotation").val());
		if (!isNaN(rotationAngle) && rotationAngle >= 0 && rotationAngle <= 360) {
		  	$hotspot.attr("rotationAngle",rotationAngle);
			$hotspot.css("transform", "rotate(" + rotationAngle + "deg)");
		}

		//Hotspot actions
		var actions = [];

		$("div.hotspotActionWrapper").each(function(index, element) {
			var $actionWrapper = $(this);
			var actionType = $actionWrapper.find("select.hotspotActionType").val();
			if(actionType !== "none"){
				var action = {actionType: actionType, actionParams: {}};
				var $actionParamsScreenSelect = $actionWrapper.find("div.hotspotActionParamsScreen select");
				if($actionParamsScreenSelect.is(":visible")){
					action.actionParams.screen = $actionParamsScreenSelect.val();
				}
				var $actionParamsScreenReplacementSelect = $actionWrapper.find("div.hotspotActionParamsScreenReplacement select");
				if($actionParamsScreenReplacementSelect.is(":visible")){
					action.actionParams.screenReplacement = $actionParamsScreenReplacementSelect.val();
				}
				var $actionParamsViewSelect = $actionWrapper.find("div.hotspotActionParamsView select");
				if($actionParamsViewSelect.is(":visible")){
					action.actionParams.view = $actionParamsViewSelect.val();
				}
				var $actionParamsElementIdSelect = $actionWrapper.find("div.hotspotActionParamsElementId select");
				if($actionParamsElementIdSelect.is(":visible")){
					action.actionParams.elementId = $actionParamsElementIdSelect.val();
				}
				var $actionParamsPuzzleSelect = $actionWrapper.find("div.hotspotActionParamsPuzzle select");
				if($actionParamsPuzzleSelect.is(":visible")){
					action.actionParams.puzzle = $actionParamsPuzzleSelect.val();
				}
				if (Object.keys(action.actionParams).length === 0) {
					delete action.actionParams;
				}
				actions.push(action);
			}
		});

		if(actions.length > 0){
			hotspotSettings.actions = actions;
		}

		screenData[screenId].hotspots[hotspotId] = hotspotSettings;
		$.fancybox.close();
	};

	/////////
	// Zones
	////////

	var _onClickInZoneMode = function(event){
		event.preventDefault();
		event.stopPropagation();
		console.log("TO DO: Add Zone");

		currentEditingMode = "NONE";
		_enableEditingMode("NONE");
	};

	/*
	 * Callback from the V.Editor.Image module to add the background
	 */
	var onBackgroundSelected = function(contentToAdd,screen){
		if(!screen){
			screen = V.Slides.getCurrentSlide();
		}

		if($(screen).attr("type")===V.Constant.FLASHCARD){
			$(screen).css("background-image", "url("+contentToAdd+")");
			$(screen).attr("avatar", "url('"+contentToAdd+"')");
			$(screen).find("div.change_bg_button").hide();

			V.Editor.Slides.updateThumbnail(screen);
			V.Editor.Tools.loadToolsForSlide(screen);
		}

		$.fancybox.close();
	};

	var getThumbnailURL = function(screen){
		var avatar = $(screen).attr('avatar');
		if(avatar){
			return V.Utils.getSrcFromCSS(avatar);
		} else {
			return getDefaultThumbnailURL();
		}
	};

	var getDefaultThumbnailURL = function(){
		return (V.ImagesPath + "templatesthumbs/flashcard_template.png");
	};

	var onThumbnailLoadFail = function(screen){
		var thumbnailURL = getDefaultThumbnailURL();
		$(screen).css("background-image", "none");
		$(screen).attr("avatar", "url('"+thumbnailURL+"')");
		$(screen).find("div.change_bg_button").show();

		if(V.Slides.getCurrentSlide()==screen){
			$("#slideset_selected > img").attr("src",thumbnailURL);
		}
		var slideThumbnail = V.Editor.Thumbnails.getThumbnailForSlide(screen);
		$(slideThumbnail).attr("src",thumbnailURL);
	};


	////////////////////
	// JSON Manipulation
	////////////////////

	/*
	 * Save the screen in JSON format
	 */
	var saveScreen = function(screenDOM){
		var screen = {};
		screen.id = $(screenDOM).attr('id');
		screen.type = V.Constant.FLASHCARD;

		var screenBackground = $(screenDOM).css("background-image");
		if((screenBackground && screenBackground !== "none")){
			screen.background = screenBackground;
		}

		if(typeof screenData[screen.id] !== "undefined"){
			var hotspotsIds = Object.keys(screenData[screen.id].hotspots);
			if(hotspotsIds.length > 0) {
				screen.hotspots = [];
				hotspotsIds.forEach(hotspotId => {
					var hotspotDOM = $("img.hotspot[id='" + hotspotId + "']");
					var hotspotPosition = $(hotspotDOM).position();
					var hotspotSettings = screenData[screen.id].hotspots[hotspotId];

					//Transform dimensions to percentage instead of absolute numbers.
					//Dimensions are calculated for a container with dimensions 800x600
					var hotspotAdaptiveX = (hotspotPosition.left*100/800).toFixed(4);
					var hotspotAdaptiveY = (hotspotPosition.top*100/600).toFixed(4);
					var hotspotAdaptiveWidth = (hotspotDOM.width()*100/800).toFixed(4);
					var hotspotAdaptiveHeight = (hotspotDOM.height()*100/600).toFixed(4);

					var hotspotJSON = {
						"id": hotspotId,
						"x": hotspotAdaptiveX,
						"y": hotspotAdaptiveY,
						"image": hotspotDOM.attr("src"),
						"width": hotspotAdaptiveWidth,
						"height": hotspotAdaptiveHeight,
						"lockAspectRatio": hotspotSettings.lockAspectRatio,
						"rotationAngle": hotspotDOM.attr("rotationAngle")
					};

					if (Array.isArray(hotspotSettings.actions) && hotspotSettings.actions.length > 0) {
						hotspotJSON.actions = hotspotSettings.actions;
					}
					screen.hotspots.push(hotspotJSON);
				});
			}
			if(Object.keys(screenData[screen.id].zones).length > 0) {
				screen.zones = screenData[screen.id].zones;
			}
		}

		screen.slides = [];
		return screen;
	};

	var getDummy = function(slidesetId,options){
		return "<article id='"+slidesetId+"' type='"+V.Constant.FLASHCARD+"' slidenumber='"+options.slideNumber+"'><div class='change_bg_button'></div></article>";
	};

	var getCurrentSubslide = function(){
		return currentSubslide;
	};

	var _setCurrentSubslide = function(newSubslide){
		currentSubslide = newSubslide;
	};

	var setCurrentHotspot = function(newHotspot){
		currentHotspot = newHotspot;
	};

	var deleteCurrentHotspot = function(){
		var options = {};
		options.width = 375;
		options.height = 130;
		//options.notificationIconSrc = V.Editor.Thumbnails.getThumbnailURL(slideToDelete);
		//options.notificationIconClass = "notificationIconDelete";
		options.text = V.I18n.getTrans("i.areYouSureDeleteHotspot");

		var button1 = {};
		button1.text = V.I18n.getTrans("i.no");
		button1.callback = function(){
			$.fancybox.close();
		}
		var button2 = {};
		button2.text = V.I18n.getTrans("i.delete");
		button2.callback = function(){
			//Delete current hotspot
			var $hotspot = $(currentHotspot);
			var hotspotId = $hotspot.attr("id");
			$hotspot.remove();
			var screenId = $(V.Slides.getCurrentSlide()).attr("id");
			delete screenData[screenId].hotspots[hotspotId];

			currentHotspot = undefined;
			V.Editor.Tools.cleanToolbar();
			$.fancybox.close();
		}
		options.buttons = [button1,button2];
		V.Utils.showDialog(options);
	};
	
	var getSubslidesQuantity = function(slideset){
		return $(slideset).children("article").length;
	};


	/////////////////
	// Slidesets
	////////////////

	var onEnterSlideset = function(slideset){
		V.Editor.Slides.updateThumbnail(slideset);
		$("#bottomside").show();
		openSlideset(slideset);

		var slidesetId = $(slideset).attr("id");
		var subslides = $("#" + slidesetId + " > article");
		V.Editor.Thumbnails.drawSlidesetThumbnails(subslides,function(){
			//Subslides Thumbnails drawed succesfully
		});
	};

	var onLeaveSlideset = function(slideset){
		closeSlideset(slideset);

		var currentSubslide = getCurrentSubslide();
		if(currentSubslide){
			closeSubslide(currentSubslide);
		}

		$("#bottomside").hide();
		$("#slideset_selected > img").attr("src","");
	};

	var onClickOpenSlideset = function(){
		var slideset = V.Slides.getCurrentSlide();
		openSlideset(slideset);
	};

	var openSlideset = function(slideset){
		//Mark slideset thumbnail as selected
		$("#slideset_selected_img").addClass("selectedSlidesetThumbnail");

		var currentSubslide = getCurrentSubslide();
		if(currentSubslide){
			closeSubslide(currentSubslide);
		}

		V.Editor.Tools.loadToolsForSlide(slideset);
	};

	var closeSlideset = function(slideset){
		//Hide slideset delete and help buttons
		_hideSlideButtons(slideset);

		//Mark slideset thumbnail as unselected
		$("#slideset_selected_img").removeClass("selectedSlidesetThumbnail");
	};

	var beforeRemoveSlideset = function(slideset){
		if(V.Slides.getCurrentSlide() === slideset){
			onLeaveSlideset(slideset);
		}
	};

	var beforeRemoveSubslide = function(slideset,subslide){
		if(V.Slides.getCurrentSubslide() === subslide){
			closeSubslide(subslide);
		}
	};

	var afterCreateSubslide = function(slideset,subslide){
	};


	/////////////////
	// Subslides
	////////////////

	var openSubslideWithNumber = function(subslideNumber){
		var slideset = V.Slides.getCurrentSlide();
		var subslides = $(slideset).find("article");
		var subslide = subslides[subslideNumber-1];
		openSubslide(subslide);
	};

	var openSubslide = function(subslide){
		var currentSubslide = getCurrentSubslide();

		if(currentSubslide){
			closeSubslide(currentSubslide);
		} else {
			var slideset = $(subslide).parent();
			closeSlideset(slideset);
		}

		_setCurrentSubslide(subslide);
		_showSubslide(subslide);
		V.Editor.Thumbnails.selectSubslideThumbnail($(subslide).attr("slidenumber"));
		V.Slides.triggerEnterEventById($(subslide).attr("id"));
	};

	var _showSubslide = function(subslide){
		$(subslide).css("display","block");
	};

	var _hideSubslide = function(subslide){
		$(subslide).css("display","none");
	};

	var closeSubslideWithNumber = function(subslideNumber){
		var slideset = V.Slides.getCurrentSlide();
		var subslides = $(slideset).find("article");
		var subslide = subslides[subslideNumber-1];
		closeSubslide(subslide);
	};

	var closeSubslide = function(subslide){
		_setCurrentSubslide(null);
		V.Editor.Thumbnails.selectSubslideThumbnail(null);
		_hideSubslide(subslide);
		V.Slides.triggerLeaveEventById($(subslide).attr("id"));
	};

	var _hideSlideButtons = function(slide){
		$(slide).find("div.delete_slide:first").hide();
	};

	return {
		init 							: init,
		getDummy						: getDummy,
		addScreen						: addScreen,
		draw 							: draw,
		refreshDraggables				: refreshDraggables,
		onBackgroundSelected 			: onBackgroundSelected,
		addHotspot						: addHotspot,
		addZone							: addZone,
		onClick 						: onClick,
		showHotspotSettings				: showHotspotSettings,
		setCurrentHotspot				: setCurrentHotspot,
		deleteCurrentHotspot			: deleteCurrentHotspot,
		onHotspotNewAction				: onHotspotNewAction,
		onHotspotDeleteAction			: onHotspotDeleteAction,
		onHotspotActionChange			: onHotspotActionChange,
		onHotspotImageSourceChange		: onHotspotImageSourceChange,
		onClickHotspotImageGallery		: onClickHotspotImageGallery,
		checkHotspotImageURLPreview		: checkHotspotImageURLPreview,
		onInputHotspotSizeWidth			: onInputHotspotSizeWidth,
		onInputHotspotSizeHeight		: onInputHotspotSizeHeight,
		onHotspotSettingsDone			: onHotspotSettingsDone,
		saveScreen						: saveScreen,
		getThumbnailURL 				: getThumbnailURL,
		getDefaultThumbnailURL			: getDefaultThumbnailURL,
		onEnterSlideset					: onEnterSlideset,
		onLeaveSlideset					: onLeaveSlideset,
		openSlideset					: openSlideset,
		closeSlideset					: closeSlideset,
		beforeRemoveSlideset			: beforeRemoveSlideset,
		beforeRemoveSubslide			: beforeRemoveSubslide,
		afterCreateSubslide				: afterCreateSubslide,
		getCurrentSubslide				: getCurrentSubslide,
		openSubslideWithNumber 			: openSubslideWithNumber,
		openSubslide					: openSubslide,
		closeSubslideWithNumber			: closeSubslideWithNumber,
		closeSubslide 					: closeSubslide,
		onClickOpenSlideset				: onClickOpenSlideset,
		getSubslidesQuantity			: getSubslidesQuantity
	};

}) (VISH, jQuery);