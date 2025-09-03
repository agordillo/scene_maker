VISH.Slideset = (function(V,$,undefined){
	var initialized = false;
	var defaultHotspotImg;

	var init = function(){
		if(initialized){
			return;
		}

		defaultHotspotImg = V.ImagesPath + "icons/hotspot.png";

		initialized = true;
	};

	var isSlideset = function(obj){
		var type;
		if(typeof obj == "string"){
			type = obj;
		} else {
			type = $(obj).attr("type");
		}
		return (type === "flashcard");
	};

	var getDefaultHotspotImg = function(){
		return defaultHotspotImg;
	};

	/////////////////
	// Callbacks
	////////////////

	var draw = function(screenJSON){
		var $screen = $("#" + screenJSON.id);

		//Background image
		$screen.css("background-image", screenJSON.background);

		//Hotspots
		for(i in screenJSON.hotspots){
			_drawHotspot($screen, screenJSON.hotspots[i]);
		}
	};

	var _drawHotspot = function($screen, hotspotJSON){
		if((!hotspotJSON)||(!hotspotJSON.id)){
			return;
		}
		if((!hotspotJSON.x)||(hotspotJSON.x < 0)||(hotspotJSON.x > 100)){
			return;
		}
		if((!hotspotJSON.width)||(hotspotJSON.y < 0)||(hotspotJSON.y > 100)){
			return;
		}
		if((!hotspotJSON.width)||(hotspotJSON.width < 0)||(hotspotJSON.width > 100)){
			return;
		}
		if((!hotspotJSON.height)||(hotspotJSON.height < 0)||(hotspotJSON.height > 100)){
			return;
		}
		if(typeof hotspotJSON.image !== "string"){
			hotspotJSON.image = defaultHotspotImg;
		}

		var rotationAngle = parseFloat(hotspotJSON.rotationAngle);
		if (typeof rotationAngle !== "number" || isNaN(rotationAngle) || rotationAngle < 0 || rotationAngle > 360) {
			rotationAngle = 0;
		}

		var $hotspot = $('<img>', {
			src: hotspotJSON.image,
			class: 'hotspot',
			id: hotspotJSON.id,
			rotationAngle: rotationAngle,
			css: {
				position: 'absolute',
				left: (hotspotJSON.x + "%"),
				top: (hotspotJSON.y + "%"),
				width: (hotspotJSON.width + "%"),
				height: (hotspotJSON.height + "%"),
				transform: "rotate(" + rotationAngle + "deg)"
			}
		}).appendTo($screen);

		if (Array.isArray(hotspotJSON.actions)&&(hotspotJSON.actions.length > 0)) {
			$hotspot.addClass("hotspot_with_actions");
			for(i in hotspotJSON.actions){
				_addActionToHotspot($hotspot, hotspotJSON.actions[i]);
			}
		}
	};

	var _addActionToHotspot = function($hotspot, action){
		$hotspot.on('click', function(){
			switch(action.actionType){
				case "goToScreen":
					if((action.actionParams)&&(typeof action.actionParams.screen === "string")){
						var screenId = action.actionParams.screen;
						var $screen = $("#" + screenId);
						if ($screen.length > 0) {
							V.Slides.goToSlide($screen.attr("slideNumber"));
						}
					}
					break;
				case "openView":
					if((action.actionParams)&&(typeof action.actionParams.view === "string")){
						var viewId = action.actionParams.view;
						var $view = $("#" + viewId);
						if ($view.length > 0) {
							V.Slides.openSubslide(viewId);
						}
					}
					break;	
				case "changeScreen":
					if((action.actionParams)&&(typeof action.actionParams.screen === "string")&&(typeof action.actionParams.screenReplacement === "string")){
						var screenId = action.actionParams.screen;
						var screenReplacementId = action.actionParams.screenReplacement;
						_replaceScreen(screenId,screenReplacementId);
					}
					break;
				case "removeElement":
					if((action.actionParams)&&(typeof action.actionParams.elementId === "string")){
						var elementId = action.actionParams.elementId;
						var $element = $("#" + elementId);
						if ($element.length > 0) {
							$element.remove();
						}
					}
				case "solvePuzzle":
					//TODO
					break;
				default:
					break;
			}
		});
	};

	var _replaceScreen = function(screenId,screenReplacementId){
		console.log("V.Slides.getCurrentSlide()",V.Slides.getCurrentSlide());

		var $screen = $("#" + screenId);
		var $screenReplacement = $("#" + screenReplacementId);
		if (($screen.length !== 1)||($screenReplacement.length !== 1)) {
			return;
		}
		console.log("_replaceScreen",screenId,screenReplacementId);

		//Change ids
		$screenReplacement.attr("id","replaceScreenTmpId");
		$screen.attr("id",screenReplacementId);
		$screenReplacement.attr("id",screenId);

		//Change slide numbers
		var slideNumberScreenReplacement = $screenReplacement.attr("slidenumber");
		$screenReplacement.attr("slidenumber",$screen.attr("slidenumber"));
		$screen.attr("slidenumber",slideNumberScreenReplacement);

		//Change subslide ids
		_changeViewsIds($screenReplacement);
		_changeViewsIds($screen);

		//Refresh
		console.log("V.Slides.getCurrentSlide() 2",V.Slides.getCurrentSlide());
		V.Slides.goToSlide(V.Slides.getCurrentSlide());
	};

	var _changeViewsIds = function($screen){
		var screenId = $screen.attr("id");
		$screen.find("article[type='standard']").each(function(index, view) {
			var oldId = $(this).attr("id");
			var suffix = oldId.split('_')[1];
			var newId = screenId + '_' + suffix;
			$(this).attr("id",newId);
		});
	};

	var onEnterSlideset = function(slideset){
		//Look for opened subslides
		var openSubslides = $(slideset).children("article.show_in_smartcard");
		if(openSubslides.length===1){
			var openSubslide = openSubslides[0];
			var subSlideId = $(openSubslide).attr("id");
			V.Slides.triggerEnterEventById(subSlideId);
		}
	};

	var onLeaveSlideset = function(slideset){
		//Look for opened subslides
		var openSubslides = $(slideset).children("article.show_in_smartcard");
		if(openSubslides.length===1){
			var openSubslide = openSubslides[0];
			var subSlideId = $(openSubslide).attr("id");
			V.Slides.triggerLeaveEventById(subSlideId);
		}
	};

	var afterSetupSize = function(increaseW,increaseH){
	};

	///////////////
	// Events
	///////////////

	var onCloseSubslideClicked = function(event){
		var close_slide_id = event.target.id.substring(5);
		V.Slides.closeSubslide(close_slide_id,true);
	};

	return {
		init 					: init,
		isSlideset				: isSlideset,
		getDefaultHotspotImg	: getDefaultHotspotImg,
		draw					: draw,
		onEnterSlideset			: onEnterSlideset,
		onLeaveSlideset			: onLeaveSlideset,
		onCloseSubslideClicked	: onCloseSubslideClicked,
		afterSetupSize			: afterSetupSize
	};

}) (VISH, jQuery);