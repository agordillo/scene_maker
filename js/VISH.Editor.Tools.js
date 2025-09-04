VISH.Editor.Tools = (function(V,$,undefined){
	
	var toolbarEventsLoaded = false;
	var INCREASE_SIZE = 1.05; //Constant to multiply or divide the actual size of the element


	/*
	 * Toolbar is divided in three zones.
	 * 1) Menu
	 * 2) Presentation toolbar (always visible and updated when current slide changed)
	 * 3) Element toolbar
	 */

	var init = function(){
		cleanToolbar();

		if(!toolbarEventsLoaded){
			//Add listeners to toolbar buttons
			$.each($("#toolbar_wrapper a.tool_action, div.tool_action"), function(index, toolbarButton) {
				$(toolbarButton).on("click", function(event){
					if(typeof V.Editor.Tools[$(toolbarButton).attr("action")] == "function"){
						if(!$(toolbarButton).find(".toolbar_presentation_wrapper").hasClass("toolbar_presentation_wrapper_disabled")){
							V.Editor.Tools[$(toolbarButton).attr("action")](this);
						}
					}
					return false; //Prevent iframe to move
				});
			});

			//Add key event for Add Url Input
			$(document).on('keydown', '.tools_input_addUrl', _addUrlOnKeyDown);

			toolbarEventsLoaded = true;
		}

		V.Editor.Tools.Menu.init();
	};
	 
	var cleanToolbar = function(){
		var cSlide = V.Slides.getCurrentSlide();
		if(typeof cSlide != "undefined"){
			loadToolsForSlide(cSlide);
		}
	};

	var enableToolbar = function(){
		$("#toolbar_wrapper").show();
	};

	var disableToolbar = function(){
		$("#toolbar_wrapper").hide();
	};


   /*
	* Menu Toolbar and Menu itself
	*/
	//Enable and disable menu methods in VISH.Editor.Tools.Menu.js


   /*
	* Presentation Toolbar
	*/

	/*
	 * Update toolbar when load slide or events
	 */
	var loadToolsForSlide = function(slide){
		_cleanPresentationToolbar();

		var type = $(slide).attr("type");
		$(".toolbar_presentation_wrapper_slideTools:not(.toolbar_" + type + ")").hide();
		$("#toolbar_slide .toolbar_btn.tool_action:not(.toolbar_" + type + ")").hide();

		switch(type){
			case V.Constant.VIEW:
				$("#toolbar_slide").removeClass("toolbar_slide_screen").addClass("toolbar_slide_view");
				break;
			case V.Constant.SCREEN:
				$("#toolbar_slide").removeClass("toolbar_slide_view").addClass("toolbar_slide_screen");
				$("#toolbar_background_wrapper").show();
				$("#toolbar_background_wrapper").children().css("visibility","visible");
				if(typeof $(slide).attr("avatar") !== "undefined"){
					$("div.tool_action[action='addHotspot']").show();
					$("div.tool_action[action='addZone']").show();
				} else {
					$("div.tool_action[action='addHotspot']").hide();
					$("div.tool_action[action='addZone']").hide();
				}
				break;
			default:
				return;
		}
	};

	var _cleanPresentationToolbar = function(){
		//Enable all buttons
		$(".toolbar_presentation_wrapper_slideTools").removeClass("toolbar_presentation_wrapper_disabled");
		//cleanZoneTools
		$(".menuselect_hide").hide();
		$(".delete_content").hide();
		_cleanElementToolbar();
	};

	/*
	 * Dirty Mode: change save buttons status
	 */
	var dirtyModeTimeout;
	var saveButtonStatus = "enabled";

	var changeSaveButtonStatus = function(status){
		switch(status){
			case "enabled":
				_enableSaveButton();
				break;
			case "loading":
				_loadingSaveButton();
				break;
			case "disabled":
				_disableSaveButton();
				break;
			default:
				return;
		}
	};

	var _enableSaveButton = function(){
		if(saveButtonStatus === "enabled"){
			return;
		}
		saveButtonStatus = "enabled";
		_stopDirtyTimeout();
		$("#toolbar_save").find(".toolbar_presentation_wrapper").removeClass("toolbar_presentation_wrapper_loading");
		$("#toolbar_save").find(".toolbar_presentation_wrapper").removeClass("toolbar_presentation_wrapper_disabled");
		$("#toolbar_save").find("p.toolbar_presentation_title").html(V.I18n.getTrans("i.Save"));

		//Menu
		$(".menu_option.menu_action[action='onSaveButtonClicked']").parent().removeClass("menu_item_disabled");
		$(".menu_option.menu_action[action='onSaveButtonClicked']").find("span").html(V.I18n.getTrans("i.Save"));
	};

	var _loadingSaveButton = function(){
		if(saveButtonStatus === "loading"){
			return;
		}
		saveButtonStatus = "loading";
		$("#toolbar_save").find(".toolbar_presentation_wrapper").addClass("toolbar_presentation_wrapper_disabled");
		$("#toolbar_save").find(".toolbar_presentation_wrapper").addClass("toolbar_presentation_wrapper_loading");
		$("#toolbar_save").find("p.toolbar_presentation_title").html(V.I18n.getTrans("i.Saving"));

		//Menu
		$(".menu_option.menu_action[action='onSaveButtonClicked']").parent().addClass("menu_item_disabled");
		$(".menu_option.menu_action[action='onSaveButtonClicked']").find("span").html(V.I18n.getTrans("i.Saving"));
	};

	var _disableSaveButton = function(){
		if(saveButtonStatus === "disabled"){
			return;
		}
		saveButtonStatus = "disabled";
		$("#toolbar_save").find(".toolbar_presentation_wrapper").removeClass("toolbar_presentation_wrapper_loading");
		$("#toolbar_save").find(".toolbar_presentation_wrapper").addClass("toolbar_presentation_wrapper_disabled");
		$("#toolbar_save").find("p.toolbar_presentation_title").html(V.I18n.getTrans("i.Saved"));

		_stopDirtyTimeout();
		dirtyModeTimeout = setTimeout(function(){
			changeSaveButtonStatus("enabled");
		}, 5000);

		//Menu
		$(".menu_option.menu_action[action='onSaveButtonClicked']").parent().addClass("menu_item_disabled");
		$(".menu_option.menu_action[action='onSaveButtonClicked']").find("span").html(V.I18n.getTrans("i.Saved"));
	};

	var _stopDirtyTimeout = function(){
		if(typeof dirtyModeTimeout != "undefined"){
			clearTimeout(dirtyModeTimeout);
		}
	};

   /*
	* Zone Tools
	*/
	var loadToolsForZone = function(zone){
		cleanZoneTool(V.Editor.getLastArea());
		
		var type = $(zone).attr("type");
		switch(type){
			case "text":  
				_loadToolbarForElement(type);
				break;
			case "image":
				_loadToolbarForElement(type);
				break;
			case "video":
				_loadToolbarForElement(type);
				break;
			case "object":
				var object = $(zone).find(".object_wrapper").children()[0];
				loadToolbarForObject(object);
				break;
			case undefined:
				//Add menuselect button and hide tooltips
				$(zone).find(".menuselect_hide").show();
				hideZoneToolTip($(zone).find(".zone_tooltip"));
				return;
			default:
				break;
		}

		//Add delete content button
		$(zone).find(".delete_content").show();
	};

	var addTooltipsToSlide = function(slide){
		var zones = $(slide).find("div.vezone");
		for (var i = 0; i < zones.length; i++) {
			addTooltipToZone(zones[i]);
		};
	};

	var addTooltipToZone = function(zone,hidden){
		var style = "";
		var visible = "true";
		if(hidden === true){
			style = "style='display:none'";
			visible = "false";
		}
		var tooltip = "<span class='zone_tooltip' visible='" + visible + "' " + style + " >"+V.I18n.getTrans('i.ZoneTooltip')+"</span>";
		$(zone).append(tooltip);

		tooltip = $(zone).find(".zone_tooltip");
		if(hidden === true){
			hideZoneToolTip(tooltip);
		} else {
			showZoneToolTip(tooltip);
		}
	};

	var showZoneToolTip = function(tooltip){
		var zone = $("div").has(tooltip);

		$(tooltip).show();
		$(tooltip).attr("visible","true");
		$(zone).attr("tooltip","true");

		if($(tooltip).css("margin-top")==="0px"){	
			_setTooltipMargins(tooltip);
		}
	};

	var _setTooltipMargins = function(tooltip){
		var zone = $("div").has(tooltip);
		var slide = $("article").has(zone);

		V.Utils.addTempShown([slide,zone,tooltip]);

		//Adjust margin-top
		var zoneHeight = $(zone).height();
		var spanHeight = $(tooltip).height();
		var marginTop = ((zoneHeight-spanHeight)/2);
		
		V.Utils.removeTempShown([slide,zone,tooltip]);

		$(tooltip).css("margin-top",marginTop+"px");
	};

	var setAllTooltipMargins = function(callback){
		$("span.zone_tooltip").each(function(index,tooltip){
			_setTooltipMargins(tooltip);
		});
		if(typeof callback == "function"){
			callback(true);
		}
	};

	var hideZoneToolTip = function(tooltip){
		var zone = $("div").has(tooltip);
		$(tooltip).hide();
		$(tooltip).attr("visible","false");
		$(zone).attr("tooltip","false");
	};

	var cleanZoneTool = function(zone){
		_cleanElementToolbar();

		var tooltip = $(zone).find(".zone_tooltip");
		if(V.Editor.isZoneEmpty(zone)){
			$(zone).find(".menuselect_hide").remove();
			$(zone).removeClass("zoneUnselected").removeClass("zoneSelected").addClass("editable");
			showZoneToolTip(tooltip);
		} else {
			$(zone).find(".menuselect_hide").hide();
			$(zone).find(".delete_content").hide();
			hideZoneToolTip(tooltip);
		}
	};

	var loadToolsForElement = function(element){
		_loadToolbarForElement(element);
	};


   /*
	* Element Toolbar
	*/
	var _loadToolbarForElement = function(type){
		_cleanElementToolbar(type);

		var toolbarClass = "toolbar_" + type;
		$("#toolbar_element").children().hide();
		$("#toolbar_element").find("." + toolbarClass).css("display","inline-block");
		document.getElementById("toolbar_settings_wrapper").style.top = "-4px";
	};

	var loadToolbarForObject = function(object){
		var objectInfo = V.Object.getObjectInfo(object);

		switch(objectInfo.type){
			case V.Constant.MEDIA.WEB:
				_loadToolbarForElement(V.Constant.MEDIA.WEB);
				break;
			default:
				_loadToolbarForElement("object");
				//object default toolbar
				break;
		}
	};

	var _cleanElementToolbar = function(type){
		if(type !== "hotspot"){
			V.Editor.Screen.setCurrentHotspot(undefined);
		}
		$("#toolbar_element").children().hide();
	};

	/*
	 * General actions
	 */
	 var exit = function(){
	 	V.Editor.Tools.Menu.exit();
	 }

   /*
	* Presentation actions
    */

  	var displaySettings = function(){
		V.Editor.Settings.displaySettings();
	};

  	var save = function(){
		V.Editor.Tools.Menu.onSaveButtonClicked();
	};

	var preview = function(){
		V.Editor.Preview.preview();
	};

   /*
	* Slideset actions
	*/

	var changeBackground = function(){
		$("#hidden_button_to_change_slide_background").trigger("click");
	};

	var deleteSlide = function(){
		V.Editor.Slides.removeCurrentSlide();
	};

	var addHotspot = function(){
		V.Editor.Screen.addHotspot();
	};

	var deleteHotspot = function(){
		V.Editor.Screen.deleteCurrentHotspot();
	};

	var addZone = function(){
		V.Editor.Screen.addZone();
	};

   /*
	* Element actions
	*/

	var zoomMore = function(){
    	_changeZoom("+");
	};
	
	var zoomLess = function(){
    	_changeZoom("-");
	};

	var resizeMore = function(){
		_resize("+");
	};

	var resizeLess = function(){
		_resize("-");
	};
	

	var _resize = function(action){
		var object, objectInfo, resizeFactor;
		var area = V.Editor.getCurrentArea();
		var type = $(area).attr("type");

		if(action=="+"){
			resizeFactor = INCREASE_SIZE;
		} else {
			resizeFactor = 1/INCREASE_SIZE;
		}

		switch(type){
			case "snapshot":
				var snapshot_wrapper = area.children(":first");
				var proportion = $(snapshot_wrapper).height()/$(snapshot_wrapper).width();
				var originalWidth = $(snapshot_wrapper).width();

				//Change width
				snapshot_wrapper.width(originalWidth*resizeFactor);
				snapshot_wrapper.height(originalWidth*resizeFactor*proportion);

				break;
			case "object":
				var parent = area.children(":first");
				object = parent.children(":first");
				objectInfo = V.Object.getObjectInfo(object);
				
				var newWidth, newHeight;
				var aspectRatio = parent.width()/parent.height();
				var originalHeight = object.height();
				var originalWidth = object.width();
				var parentoriginalHeight = parent.height();
				var parentoriginalWidth = parent.width();

				//Change width
				$(parent).width(parentoriginalWidth*resizeFactor);
				$(parent).height(parentoriginalHeight*resizeFactor);

				var styleZoom = V.Utils.getZoomFromStyle($(object).attr("style"));
				if(styleZoom!=1){
					newWidth = newWidth/styleZoom;
					newHeight = Math.round(newWidth/aspectRatio);
					newWidth = Math.round(newWidth);
				} else {
					newHeight = parentoriginalHeight*resizeFactor;
					newWidth = parentoriginalWidth*resizeFactor;
				}	
					
				$(object).width(newWidth);
				$(object).height(newHeight);
				break;
			case "image":
				object = $(area).find("img");

				var originalHeight = object.height();
				var originalWidth = object.width();

				//Change width
				object.width(originalWidth*resizeFactor);
				object.height(originalHeight*resizeFactor);

				break;
			case "video":
				object = $(area).find("video");

				var originalHeight = object.height();
				var originalWidth = object.width();

				//Change width
				object.width(originalWidth*resizeFactor);
				object.height(originalHeight*resizeFactor);

				break;
			default:
				break;
		}
	};

	var _changeZoom = function(action){
		var object, objectInfo, zoom;
		var area = V.Editor.getCurrentArea();
		var type = $(area).attr("type");    
		switch(type){
			case "object":
				var parent = area.children(":first");
				object = parent.children(":first");
				objectInfo = V.Object.getObjectInfo(object);
				if([V.Constant.MEDIA.WEB,V.Constant.MEDIA.WEB_APP].indexOf(objectInfo.type)!=-1){
					var iframe = $(area).find("iframe");
					zoom = V.Utils.getZoomFromStyle($(iframe).attr("style"));

					if(action=="+"){
						zoom = zoom + 0.1;
					} else {
						zoom = zoom - 0.1;
					}

					$(iframe).attr("style",V.Editor.Utils.addZoomToStyle($(iframe).attr("style"),zoom));

					//Resize object to fix in its wrapper
					V.Editor.Object.autofixWrapperedObjectAfterZoom(iframe,zoom);
				}		
				break;
			default:
				break;
		}
	};

	var addLink = function(){
		$.fancybox(
			$("#tools_addUrl").html(),
			{
				'autoDimensions'	: false,
				'scrolling': 'no',
				'width'         	: 800,
				'height'        	: 215,
				'showCloseButton'	: true,
				'padding' 			: 0,
				'onStart'			: function(){
				},
				'onComplete'		: function(){
					var area = V.Editor.getCurrentArea();
					var hyperlink = $(area).attr("hyperlink");
					if(hyperlink){
						$(".tools_input_addUrl").val(hyperlink);
						$(".removeUrlButton").show();
					} else {
						$(".removeUrlButton").hide();
					}
				},
				'onClosed'	: function(){
					$(".removeUrlButton").hide();
				}
			}
		);
	};

	var _addUrlOnKeyDown = function(event){
		switch (event.keyCode) {
			case 13:
				addUrl();
				break;
			default:
				break;
		}
	};

	var addUrl = function(){
		var url;
		$(".tools_input_addUrl").each(function(index,input){
			if($($(input).parent().parent()).attr("id") !== "tools_addUrl"){
				url = $(input).val();
			}
		});
		if(url){
			url = V.Editor.Utils.autocompleteUrls(url);

			var area = V.Editor.getCurrentArea();
			switch($(area).attr("type")){
				case "image":
					$(area).attr("hyperlink",url);
					break;
				default:
					//Currently only for images
					break;
			}
		}
		$.fancybox.close();
	};

	var removeUrl = function(){
		var area = V.Editor.getCurrentArea();
		$(area).removeAttr("hyperlink");
		$.fancybox.close();
	};


	/* Element Settings */
  	var showElementSettings = function(target){
  		var $target = $(target);
 		if ($target.hasClass("toolbar_hotspot")) {
		    V.Editor.Screen.showHotspotSettings();
		} else {
  			//Element of a zone
  			switch($(V.Editor.getCurrentArea()).attr("type")){
  				case V.Constant.OBJECT:
  					V.Editor.Object.showObjectSettings();
  					break;
  				default:
  					break;
  			}
  		}
  	};

	return {		
		init							: init,
		loadToolsForSlide				: loadToolsForSlide,
		loadToolsForElement				: loadToolsForElement,
		loadToolsForZone				: loadToolsForZone,
		loadToolbarForObject			: loadToolbarForObject,
		cleanZoneTool 					: cleanZoneTool,
		cleanToolbar					: cleanToolbar,
		enableToolbar					: enableToolbar,
		disableToolbar					: disableToolbar,
		addLink							: addLink,
		addUrl 							: addUrl,
		removeUrl 						: removeUrl,
		resizeMore						: resizeMore,
		resizeLess						: resizeLess,
		zoomMore 						: zoomMore,
		zoomLess 						: zoomLess,
		save 							: save,
		displaySettings   				: displaySettings,
		preview 						: preview,
		deleteSlide 					: deleteSlide,
		changeBackground				: changeBackground,
		addHotspot						: addHotspot,
		deleteHotspot 					: deleteHotspot,
		addZone							: addZone,
		addTooltipsToSlide				: addTooltipsToSlide,
		addTooltipToZone				: addTooltipToZone,
		showZoneToolTip					: showZoneToolTip,
		hideZoneToolTip					: hideZoneToolTip,
		setAllTooltipMargins			: setAllTooltipMargins,
		changeSaveButtonStatus			: changeSaveButtonStatus,
		showElementSettings 			: showElementSettings,
		exit							: exit
	};

}) (VISH, jQuery);