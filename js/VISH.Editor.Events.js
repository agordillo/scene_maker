/*
 * Events for ViSH Editor (the events of the Viewer are handled in VISH.Events.js)
 */
VISH.Editor.Events = (function(V,$,undefined){
	
	var _bindedEditorEventListeners = false;
	var _confirmOnExit;
	var _isCtrlKeyPressed = false;

	var init = function(){
		bindEditorEventListeners();
	};

	var bindEditorEventListeners = function(){
		if(!_bindedEditorEventListeners){
			$(document).on('click', '#addScreenButton', V.Editor.Screen.addScreen);
			$(document).on('click', '#addSlideButtonOnSubslides', V.Editor.Tools.Menu.insertSubslide);
			$(document).on('click', '#slideset_selected_img', V.Editor.Screen.onClickOpenSlideset);
					
			$(document).on('click', '#save_presentation_details', V.Editor.Settings.onSavePresentationDetailsButtonClicked);
			$(document).on('click','div.viewthumb', V.Editor.onViewThumbClicked);

			$(document).on('click','.editable', V.Editor.onEditableClicked);
			$(document).on('click','.selectable', V.Editor.onSelectableClicked);
			$(document).on('click',':not(".selectable"):not(".preventNoselectable")', V.Editor.onNoSelectableClicked);
			
			$(document).on('click','.delete_screen', V.Editor.Slides.onDeleteScreenClicked);
			$(document).on('click','.delete_subslide', V.Editor.Slides.onDeleteSubslideClicked);
			$(document).on('click','.delete_content', V.Editor.onDeleteItemClicked);

			$(document).on("click", ".change_bg_button", V.Editor.Tools.changeBackground);

			$(document).on("click", "#tab_pic_from_url_content button.button_addContent", V.Editor.Image.addContent);
			$(document).on("click", "#tab_object_from_web_content button.button_addContent", V.Editor.Object.Web.drawPreviewElement);
			$(document).on("click", "#tab_video_from_url_content button.button_addContent", V.Editor.Video.addContent);

			$(document).on("click", "button.addUrlButton", V.Editor.Tools.addUrl);
			$(document).on("click", "button.removeUrlButton", V.Editor.Tools.removeUrl);

			//Hotspot Settings
			$(document).on("change", "#hotspotImageSource", V.Editor.Screen.onHotspotImageSourceChange);
			$(document).on("click", "#hotspotImageGallery img", V.Editor.Screen.onClickHotspotImageGallery);
			$(document).on("blur", "#hotspotImageURL", V.Editor.Screen.checkHotspotImageURLPreview);
			$(document).on("input", "#hotspotSizeWidth", V.Editor.Screen.onInputHotspotSizeWidth);
			$(document).on("input", "#hotspotSizeHeight", V.Editor.Screen.onInputHotspotSizeHeight);
			$(document).on("click", "#hotspotNewAction", V.Editor.Screen.onHotspotNewAction);
			$(document).on("click", "div.delete_action", V.Editor.Screen.onHotspotDeleteAction);
			$(document).on("change", "select.hotspotActionType", V.Editor.Screen.onHotspotActionChange);
			$(document).on("change", "div.hotspotActionParamsPuzzle select", V.Editor.Screen.onHotspotPuzzleChange);
			$(document).on("click", "#hotspotSettingsDone", V.Editor.Screen.onHotspotSettingsDone);
		
			//Element settings
			$(document).on("click", "#objectSettingsDone", V.Editor.Object.onObjectSettingsDone);

			$(document).on('click', handleClick);
			$(document).bind('keydown', handleBodyKeyDown);
			$(document).bind('keyup', handleBodyKeyUp);

			// Slide Enter and Leave events
			$('article').live('slideenter', V.Editor.onSlideEnterEditor);
			$('article').live('slideleave', V.Editor.onSlideLeaveEditor);

			//Waiting overlay
			$(document).on('click',"#waiting_overlay", function(event){
				event.stopPropagation();
				event.preventDefault();
			});

			$(window).on('orientationchange',function(){
				$(window).trigger('resize');
			});

			//Focus
			$(window).focus(function(){
				V.Status.setWindowFocus(true);
			}).blur(function(){
				V.Status.setWindowFocus(false);
			});

			//Fancyboxes

			// fancybox to create a new slide
			$("a#addSlideFancybox").fancybox({
				'autoDimensions' : false,
				'scrolling': 'no',
				'width': 800,
				'height': 740,
				'padding': 0,
				"onStart"  : function(data) {
					var slidesAddMode = V.Editor.getContentAddMode();
					if(slidesAddMode===V.Constant.NONE){
						V.Editor.setContentAddMode(V.Constant.VIEW);
					}
					var clickedZoneId = $(data).attr("zone");
					V.Editor.setCurrentArea($("#" + clickedZoneId));
					V.Editor.Utils.loadTab('tab_views');
				},
				"onClosed"  : function(data) {
					V.Editor.setContentAddMode(V.Constant.NONE);
				}
			});
			
			//Loading fancybox
			$("#fancyLoad").fancybox({
				'type'		   : 'inline',
				'autoDimensions' : false,
				'scrolling': 'no',
				'autoScale' : true,		      
				'width': '100%',
				'height': '100%',
				'padding': 0,
				'margin' : 0,
				'overlayOpacity': 0.0,
				'overlayColor' : "#fff",
				'showCloseButton'	: false,
				'onComplete'  : function(data) {
					V.Utils.Loader.prepareFancyboxForFullLoading();
				},
				'onClosed' : function(data) {
				}
			});

			//Change background
			$("#hidden_button_to_change_slide_background").fancybox({
				'autoDimensions' : false,
				'width': 800,
				'scrolling': 'no',
				'height': 600,
				'padding' : 0,
				"onStart"  : function(data) {
					V.Editor.Image.setAddContentMode(V.Constant.SCREEN);
					V.Editor.Utils.loadTab('tab_pic_from_url');
				},
				"onClosed"  : function(data) {
					V.Editor.Image.setAddContentMode(V.Constant.NONE);
				}
			});

			//onbeforeunload event
			window.onbeforeunload = _exitConfirmation;
			_confirmOnExit = true;

			_bindedEditorEventListeners = true;
		}
	};

	//////////////
	// Event Listeners
	//////////////
	var addZoneThumbsEvents = function(container){

		$(container).find("a.addpicture").fancybox({
			'autoDimensions' : false,
			'width': 800,
			'scrolling': 'no',
			'height': 600,
			'padding' : 0,
			"onStart"  : function(data) {
				//re-set the current area to the clicked zone, because maybe the user have clicked in another editable zone before this one
				var clickedZoneId = $(data).attr("zone");
				V.Editor.setCurrentArea($("#" + clickedZoneId));
				V.Editor.Image.setAddContentMode(V.Constant.NONE);
				V.Editor.Utils.loadTab('tab_pic_from_url');
			}
		});

		$(container).find("a.addobject").fancybox({
			'autoDimensions' : false,
			'width': 800,
			'height': 600,
			'scrolling': 'no',
			'padding' : 0,
			"onStart"  : function(data) {
				var clickedZoneId = $(data).attr("zone");
				V.Editor.setCurrentArea($("#" + clickedZoneId));
				V.Editor.Utils.loadTab('tab_object_from_web');
			}
		});

		$(container).find("a.addvideo").fancybox({
			'autoDimensions' : false,
			'width': 800,
			'scrolling': 'no',
			'height': 600,
			'padding' : 0,
			"onStart"  : function(data) {
				var clickedZoneId = $(data).attr("zone");
				V.Editor.setCurrentArea($("#" + clickedZoneId));
				V.Editor.Utils.loadTab(V.Editor.Video.getDefaultTab());
			}
		});
	};


	//////////////
	// Event Listeners
	//////////////
	
	var handleClick = function(event){
		V.Editor.Screen.onClick(event);
	};

	var handleBodyKeyDown = function(event){
		switch (event.keyCode) {
		case 39: // right arrow
			if(V.Editor.Slides.isSlideFocused()){
				if(V.Screen.isScreen(V.Slides.getCurrentScreen())){
					V.Editor.Slides.forwardOneSubslide();
				}
				event.preventDefault();
			}
			break;
		case 40: //down arrow	    
			if(V.Editor.Slides.isSlideFocused()){
				V.Slides.forwardOneSlide();
				event.preventDefault();
			}
			break;
		case 37: // left arrow
			if(V.Editor.Slides.isSlideFocused()){
				if(V.Screen.isScreen(V.Slides.getCurrentScreen())){
					V.Editor.Slides.backwardOneSubslide();
				}
				event.preventDefault();
			}
			break;
		case 38: //up arrow	
			if(V.Editor.Slides.isSlideFocused()){
				V.Slides.backwardOneSlide();
				event.preventDefault();    		
			}
			break;
		case 17: //ctrl key
			_isCtrlKeyPressed = true;
			break;	
		case 67: //cKey
			if(V.Editor.Slides.isSlideFocused()){
				if(_isCtrlKeyPressed){
					if(V.Slides.getCurrentScreenNumber()){
						V.Editor.Clipboard.copy(V.Slides.getCurrentScreen());
					}
				}
			}
			break;	
		case 86: //vKey
		    if(V.Editor.Slides.isSlideFocused()){
			    if(_isCtrlKeyPressed){
			    	V.Editor.Clipboard.paste();
		    	}
		    }
		    break;
		case 46: //Supr key
			if(V.Editor.Slides.isSlideFocused()){
				V.Editor.Slides.removeCurrentSlide();
			}
			break;	
		}
	};

	var handleBodyKeyUp = function(event) {
	  switch (event.keyCode) {
	    case 17: //ctrl key
	    	_isCtrlKeyPressed = false;
	    	break;	     
	  }
	};

	var _exitConfirmation = function(){
		V.EventsNotifier.notifyEvent(V.Constant.Event.exit);
		if(_confirmOnExit){
			if(V.Editor.hasPresentationChanged()){
				var confirmationMsg = V.I18n.getTrans("i.exitConfirmation");
				return confirmationMsg;
			}
		}
	};

	var allowExitWithoutConfirmation = function(){
		_confirmOnExit = false;
	};

	return {
			init 							: init,
			bindEditorEventListeners		: bindEditorEventListeners,
			addZoneThumbsEvents				: addZoneThumbsEvents,
			allowExitWithoutConfirmation 	: allowExitWithoutConfirmation
	};

}) (VISH,jQuery);
