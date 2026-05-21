SceneMaker.Editor = (function(SM,$,undefined){
	var initOptions;
	var initialScene;
	var existingSceneLoaded = false;
	var lastStoredSceneStringify;
	//Pointers to the current and last zone
	var currentZone;
	var lastZone;
	//Pointer to the current draw container
	var currentContainer;
	//Content mode to add slides
	var contentAddModeForSlides = SM.Constant.NONE;

	/**
	 * Scene Maker Editor initializer.
	 */
	var init = function(){
		return _initWithOptions(SM.getOptions());
	}

	var _initWithOptions = function(options){
		$("#waiting_overlay").show();
		
		$("body").addClass("SceneMakerBody");
		SM.Editing = true;
		SM.Debugging.init(options);

		var scene;
		if(options){
			scene = options.scene;
			initOptions = options;
			if((options.configuration)&&(SM.Configuration)){
				SM.Configuration.init(options.configuration);
			}
		} else {
			initOptions = {};
		}

		existingSceneLoaded = ((typeof scene === "object")&&(initOptions.importedScene !== true));

		SM.Utils.init();
		SM.I18n.init(initOptions,scene);

		SM.Status.init();
		SM.ViewerAdapter.applyLanguageCSS();
		SM.I18n.translateUI();
		SM.Object.init();
		SM.Editor.Dummies.init();
		SM.EventsNotifier.init();
		SM.Screen.init();
		SM.Editor.Screen.init();
		SM.View.init();
		SM.Editor.View.init();
		SM.Marker.init();
		SM.Editor.Marker.init();
		SM.Editor.Actions.init();
		SM.Editor.Caption.init();
		SM.Renderer.init();
		SM.Slides.init();
		SM.User.init(initOptions);
		SM.Video.init();
		SM.Audio.init();
		SM.Editor.Settings.init();
		
		if(typeof scene === "object"){
			scene = SM.Utils.fixScene(scene);
			if(scene===null){
				$("#waiting_overlay").hide();
				SM.Utils.showPNotValidDialog();
				return;
			}
			initialScene = scene;
			SM.Editor.Settings.loadSceneSettings(scene);
			SM.Editor.Renderer.init(scene);
			//Remove focus from any zone
			_removeSelectableProperties();
			_initAferSceneLoaded(initOptions,scene);
		} else {
			SM.Editor.Settings.loadSceneSettings();
			_initAferSceneLoaded(initOptions,scene);
		}
	};
	
	var _initAferSceneLoaded = function(options,scene){
		var isScene = (typeof scene === "object");

		if(isScene){
			//Set current slide
			var slideFromHash = SM.Utils.getScreenNumberFromHash();
			if(slideFromHash){
				SM.Screen.setCurrentScreenNumber(slideFromHash);
			} else {
				SM.Screen.setCurrentScreenNumber(1);
			}
		}
		SM.Screen.updateScreens();
		SM.Editor.Thumbnails.drawScreenThumbnails(function(){
			SM.Editor.Thumbnails.selectThumbnail(SM.Screen.getCurrentScreenNumber());
			SM.Editor.Thumbnails.moveThumbnailsToScreenWithNumber(SM.Screen.getCurrentScreenNumber());
		});
		
		if(isScene){
			//hide objects (the onSlideEnterEditor event will show the objects in the current slide)
			$('.object_wrapper').hide();
		}
		
		//Init submodules
		SM.Editor.Text.init();
		SM.Editor.Image.init();
		SM.Editor.Video.init();
		SM.Editor.Audio.init();
		SM.Editor.Object.init();
		SM.Editor.Thumbnails.init();
		SM.Editor.Preview.init();
		SM.Editor.Tools.init();
		SM.Editor.Clipboard.init();
		SM.Editor.Events.init();
		
		//Unload all objects
		SM.Editor.Utils.Loader.unloadAllObjects();

		//Enter in currentSlide (this will cause that objects will be shown)
		if(SM.Screen.getCurrentScreenNumber()>0){
			SM.Slides.triggerSlideEnterEvent($(SM.Screen.getCurrentScreen()).attr("id"));
		}

		//Add the first slide and init settings
		if(!isScene){
			var screen = SM.Editor.Dummies.getDummy(SM.Constant.SCREEN,{slideNumber:1});
			SM.Editor.Screen.addScreen(screen);
			SM.Screen.goToScreenWithNumber(1);
			SM.Editor.Settings.displaySettings();
		}

		//Try to win focus
		window.focus();

		$("#waiting_overlay").hide();
	};
  

	////////////
	// UI EVENTS
	////////////

	/**
	 * Function called when user clicks on view thumb.
	 * Add a new view to the current screen.
	 */
	var onViewThumbClicked = function(event){
		var screen = SM.Screen.getCurrentScreen();
		if(!SM.Slides.isScreen(screen)){
			return;
		}
		var type = $(event.currentTarget).attr('type');
		var view = SM.Editor.Dummies.getDummy(type, {screenId: $(screen).attr("id"), slideNumber: ($(screen).find("article").length + 1)});
		SM.Editor.View.addView(screen,view);
		$.fancybox.close();
	};


	/**
	 * Function called when user clicks on an editable element
	 * Event launched when an editable element belonging to the slide is clicked
	 */
	var onEditableClicked = function(event){
		//first remove the "editable" class because we are going to add clickable icons there and we don´t want it to be editable any more
		$(this).removeClass("editable");
		setCurrentArea($(this));
				
		//need to clone it, because we need to show it many times, not only the first one
		//so we need to remove its id
		var content = $("#menuselect").clone();
		$(content).removeAttr("id");
		
		$(content).find("a").css("display","none").addClass("thumb_shown");
		
		SM.Editor.Tools.hideZoneToolTip($(this).find(".zone_tooltip"));

		$(this).append(content);

		SM.Editor.Events.addZoneThumbsEvents(this);
	}; 

	/**
	* function called when user clicks on the delete icon of the zone
	*/
	var onDeleteItemClicked = function(){
		setCurrentArea($(this).parent());

		var options = {};
		options.width = 375;
		options.height = 135;
		var currentArea = getCurrentArea();
		var areaType = currentArea.attr("type");
		if((areaType === "audio")||((areaType === "object")&&(currentArea.attr("object_type") === SM.Constant.MEDIA.YOUTUBE_VIDEO))){
			areaType = "video";
		}
		
		options.notificationIconSrc = SM.ImagesPath + "thumbs/" + areaType + ".png";
		options.text = SM.I18n.getTrans("i.AreYouSureContent");
		var button1 = {};
		button1.text = SM.I18n.getTrans("i.no");
		button1.callback = function(){
			$.fancybox.close();
		}
		var button2 = {};
		button2.text = SM.I18n.getTrans("i.delete");
		button2.callback = function(){
			var area = getCurrentArea();
			area.html("");
			area.removeAttr("type");
			area.addClass("editable");
			SM.Editor.Tools.addTooltipToZone(area);
			selectContentZone(null);
			SM.Editor.Slides.updateThumbnail(SM.Slides.getCurrentSlide());
			$.fancybox.close();
		}
		options.buttons = [button1,button2];
		SM.Utils.showDialog(options);
	};
  
   /**
	* Function called when user clicks on a content zone with class selectable.
	* Selectable elements are zones which can be selected.
	*/
	var onSelectableClicked = function(event){
		selectContentZone($(this));
		event.stopPropagation();
		event.preventDefault();
	};

	var selectContentZone = function(area){
		setCurrentArea(area);
		_removeSelectableProperties();
		_addSelectableProperties(area);
		SM.Editor.Tools.loadToolsForZone(area);
	};
	
	var _addSelectableProperties = function(zone){
		$(zone).removeClass("zoneUnselected");
		$(zone).addClass("zoneSelected");
	};

	var _removeSelectableProperties = function(zone){
		if(zone){
			$(zone).removeClass("zoneSelected");
			$(zone).addClass("zoneUnselected");
		} else {
			$(".zoneSelected").addClass("zoneUnselected");
			$(".zoneSelected").removeClass("zoneSelected");
		}
	};
  
   /**
	* Function called when user clicks on any element without class selectable
	*/
	var onNoSelectableClicked = function(event){
		var target = $(event.target);
		var targetParent = $(target).parent();

		if(!$(target).hasClass("noSelectableElement")){

			//No hide toolbar when we are working in a fancybox
			if($("#fancybox-content").is(":visible")){
				return;
			}

			//No hide toolbar when dragging annotations
			if ($(target).is("polygon")) {
				return;
			}

			//No hide toolbar for selectable or preventNoselectable childrens
			if($(targetParent).hasClass("selectable") || $(targetParent).hasClass("preventNoselectable")){
				return;
			}

			//Enable toolbar actions
			if (jQuery.contains($("#toolbar_wrapper")[0],event.target)){
				return;
			}
			if(event.target.id==="toolbar_wrapper"){
				return;
			}

			//No hide toolbar when we are working in a wysiwyg fancybox
			var isWysiwygFancyboxEnabled = false;
			$(".cke_dialog").each(function(index,cke_dialog){
				if((cke_dialog)&&(jQuery.contains(cke_dialog,event.target))){
					isWysiwygFancyboxEnabled = true;
					return false;
				}
			});
			if(isWysiwygFancyboxEnabled){
				return;
			}
		}

		cleanArea();
	};

	var cleanArea = function(){
		SM.Editor.Tools.cleanZoneTool(getCurrentArea());
		setCurrentArea(null);
		_removeSelectableProperties();
	};

	var addDeleteButton = function(element){
		element.append("<div class='delete_content'></div>");
	};

	/**
	* Function called when entering slide in editor, we have to show the objects
	*/
	var onSlideEnterEditor = function(e){
		var slide = $(e.target);

		//Prevent parent to trigger onSlideEnterEditor
		//Use to prevent screens to be called when enter in one of their views
		e.stopPropagation();

		if(SM.Slides.isScreen(slide)){
			SM.Editor.Screen.onEnterScreen(slide);
		} else {
			//Views
			SM.Editor.Utils.Loader.loadObjectsInEditorSlide(slide);
			//Show objects
			setTimeout(function(){
				$(slide).find('.object_wrapper').show();
			},500);
		}

		SM.Editor.Thumbnails.selectThumbnail(SM.Screen.getCurrentScreenNumber());
		cleanArea();
		SM.Editor.Tools.loadToolsForSlide(slide);
	};
  
	/**
	* Function called when leaving slide in editor, we have to hide the objects
	*/
	var onSlideLeaveEditor = function(e){
		var slide = $(e.target);
		e.stopPropagation();

		if(SM.Slides.isScreen(slide)){
			SM.Editor.Screen.onLeaveScreen(slide);
		} else {
			//View
			SM.Editor.Utils.Loader.unloadObjectsInEditorSlide(slide);
			//Hide objects
			$('.object_wrapper').hide();
		}
	};


	////////////
	// Save Scene to JSON
	////////////
	
	var saveScene = function(){
		//Save the scene in JSON
		var scene = {};

		//Get options
		var options = SM.Utils.getOptions();

		//Save settings
		scene = SM.Editor.Settings.getSettings();
		
		//Save data from options
		if(options){
			if(typeof options.erId === "number"){
				scene.erId = options.erId;
			}
		}

		//Save screens
		scene.screens = [];

		//Load and show all objects
		SM.Editor.Utils.Loader.loadAllObjects();
		$(".object_wrapper").show();

		$('section.slides > article').each(function(index,screenDOM){
			var screen = {};
			if(SM.Slides.isScreen(screenDOM)){
				SM.Utils.addTempShown(screenDOM);
				screen = SM.Editor.Marker.saveSlideWithMarkers(screenDOM);
				screen.views = [];
				//Save views
				$(screenDOM).find("article").each(function(index,viewDOM){
					var view = _saveView(viewDOM,scene,true);
					screen.views.push(view);
				});
				SM.Utils.removeTempShown(screenDOM);
				scene.screens.push(screen);
			}	
		});

		//Unload all objects
		SM.Editor.Utils.Loader.unloadAllObjects();
		//Reload current slide objects
		SM.Editor.Utils.Loader.loadObjectsInEditorSlide(SM.Screen.getCurrentScreen());

		SM.Debugging.log("\n\nScene Maker save the following scene:\n");
		SM.Debugging.log(JSON.stringify(scene));

		return scene;
	};

	var _saveView = function(slideDOM,scene){
		switch($(slideDOM).attr('type')){
			case SM.Constant.VIEW_IMAGE:
				return _saveViewImage(slideDOM,scene);
			case SM.Constant.VIEW_CONTENT:
				return _saveViewContent(slideDOM,scene);
		}
	};

	var _saveViewImage = function(viewDOM){
		SM.Utils.addTempShown(viewDOM);
		var view = SM.Editor.Marker.saveSlideWithMarkers(viewDOM);
		SM.Utils.removeTempShown(viewDOM);
		return view;
	};

	var _saveViewContent = function(slideDOM,scene){
		slide = {};
		slide.id = $(slideDOM).attr('id');
		slide.type = $(slideDOM).attr('type');
		slide.elements = [];

		//important show it (the browser does not know the height and width if it is hidden)
		SM.Utils.addTempShown(slideDOM);

		$(slideDOM).find('div.view_content_zone').each(function(i,div){
			var element = {};
			element.id	= $(div).attr('id');
			element.type = $(div).attr('type');

			//Save element settings
			var elSettings = $(div).attr("elSettings");
			if(typeof elSettings === "string"){
				try {
					element.settings = JSON.parse(elSettings);
				} catch(e){}
			}

			if(element.type==SM.Constant.TEXT){
				var CKEditor = SM.Editor.Text.getCKEditorFromZone(div);
				if(CKEditor!==null){
					element.body = CKEditor.getData();
				} else {
					element.body = "";
				}
			} else if(element.type==SM.Constant.IMAGE){
				element.body   = $(div).find('img').attr('src');
				element.style  = SM.Editor.Utils.getStylesInPercentages($(div),$(div).find('img'));
				if($(div).attr("hyperlink")){
					element.hyperlink = $(div).attr("hyperlink");
				}
			} else if(element.type==SM.Constant.VIDEO){
				var video = $(div).find("video");
				var posterURL = $(video).attr("poster");
				if(typeof posterURL === "string"){
					element.poster = posterURL;
				}
				element.style  = SM.Editor.Utils.getStylesForFitContent();
				//Sources
				var sources= '';		
				$(video).find('source').each(function(index, source) {
					if(index!==0){
						sources = sources + ',';
					}
					var sourceSrc = SM.Utils.removeParamFromUrl($(source).attr("src"),"timestamp");
					var sourceMimeType = (typeof $(source).attr("type") != "undefined")?', "type": "' + $(source).attr("type") + '"':'';
					sources = sources + '{"src":"' + sourceSrc + '"' + sourceMimeType + '}';
				});
				sources = '[' + sources + ']';
				element.sources = sources;
			} else if(element.type==SM.Constant.AUDIO){
				var audio = $(div).find("audio");
				element.style  = SM.Editor.Utils.getStylesForFitContent();
				//Sources
				var sources= '';				
				$(audio).find('source').each(function(index, source) {
					if(index!==0){
						sources = sources + ',';
					}
					var sourceSrc = SM.Utils.removeParamFromUrl($(source).attr("src"),"timestamp");
					var sourceMimeType = (typeof $(source).attr("type") != "undefined")?', "type": "' + $(source).attr("type") + '"':'';
					sources = sources + '{"src":"' + sourceSrc + '"' + sourceMimeType + '}';
				});
				sources = '[' + sources + ']';
				element.sources = sources;
			} else if(element.type===SM.Constant.OBJECT){
				var wrapper = $(div).find(".object_wrapper")[0];
				var object = $(wrapper).children()[0];
				var $myObject = $(object).clone();
				$myObject.removeAttr("style");

				element.subtype = SM.Object.getObjectInfo($myObject).type;

				if(typeof element.settings === "undefined"){
					//Set default settings
					if(element.subtype === SM.Constant.MEDIA.REUSABLE_PUZZLE_INSTANCE){
						element.settings = SM.Edtitor.Object.Web.getDefaultSettingsForReusablePuzzleInstance();
					} else if(element.subtype === SM.Constant.MEDIA.WEB){
						element.settings = SM.Edtitor.Object.Web.getDefaultSettingsForWeb();
					}
				}
				
				if((element.subtype === SM.Constant.MEDIA.REUSABLE_PUZZLE_INSTANCE)||(element.settings && element.settings.addPreviewParamToObject === true)){
					var myObjectSrc = SM.Utils.removeParamFromUrl($myObject.attr("src"),"preview");
					$myObject.attr("src",myObjectSrc);
				}

				element.body   = SM.Utils.getOuterHTML($myObject);
				element.style  = SM.Editor.Utils.getStylesForFitContent();

			} else if(typeof element.type == "undefined"){
				//Empty element
			}

			slide.elements.push(element);
			
		});

		SM.Utils.removeTempShown(slideDOM);
		
		return slide;
	};

	var sendScene = function(scene,successCallback,failCallback){
		if(SM.Debugging.isDevelopping()){
			lastStoredSceneStringify = JSON.stringify(scene);
			setTimeout(function(){
				successCallback();
			},5000);
			return;
		}

		var createNewScene = ((typeof lastStoredSceneStringify == "undefined")&&(!existingSceneLoaded));
		
		var send_type;
		if(createNewScene){
			send_type = 'POST'; //new scene
		} else {
			send_type = 'PUT';  //editing an existing scene
		}

		var params = {};
		if(typeof SM.User.getToken() !== "undefined"){
			params["authenticity_token"] = SM.User.getToken();
		}

		var jsonScene = JSON.stringify(scene);
		params["scene[json]"] = jsonScene;
		
		$.ajax({
			type    : send_type,
			url     : SM.UploadScenePath,
			data    : params,
			success : function(data) {
				lastStoredSceneStringify = jsonScene;
				if((createNewScene)&&(typeof data !== "undefined")&&(data.uploadPath)){
					//Update SM.UploadScenePath because the scene exists now
					//Future savings will update the existing scene
					SM.UploadScenePath = SM.Utils.checkUrlProtocol(data.uploadPath);
					if(SM.Status.getFeatures().historypushState){
						window.top.history.replaceState("","",SM.UploadScenePath);
					}
				}
				if(typeof successCallback == "function"){
					successCallback(data);
				}
			},
			error: function(xhr, error){
				if(typeof failCallback == "function"){
					failCallback();
				}
			}
		});
	};


	////////////
	// Export and import
	////////////

	var exportSceneToJSON = function(){
		if(SM.Screen.getScreens().length === 0){
			var options = {};
			options.width = 600;
			options.height = 150;
			options.text = SM.I18n.getTrans("i.NoSlidesOnSaveNotification");
			var button1 = {};
			button1.text = SM.I18n.getTrans("i.Ok");
			button1.callback = function(){
				$.fancybox.close();
			}
			options.buttons = [button1];
			SM.Utils.showDialog(options);
			return;
		}

		var scene = saveScene();
		const sceneJSONString = JSON.stringify(scene, null, 2);
		const sceneBlob = new Blob([sceneJSONString], { type: "application/json" });
		const sceneURL = URL.createObjectURL(sceneBlob);
		const sceneLink = document.createElement("a");
		sceneLink.href = sceneURL;
		sceneLink.download = SM.Editor.Utils.toPascalCase(scene.title) + "_" + SM.Editor.Utils.getDateISO() + ".json";
		document.body.appendChild(sceneLink);
		sceneLink.click();
		document.body.removeChild(sceneLink);
  		URL.revokeObjectURL(sceneLink);
	};

	var importSceneFromJSON = async function () {
		const fileInput = $("#import_file_input")[0];
		const file = fileInput.files[0];
		if ((!file) || (!file.name.endsWith(".json"))) {
			_showWrongImportedFileDialog(false);
			return false;
		}

		let scene;
		try {
			const fileText = await file.text();
			scene = JSON.parse(fileText);
		} catch (err) {
			_showWrongImportedFileDialog(true);
			return false;
		}

		if(scene){
			scene = SM.Utils.fixScene(scene);
			if(scene === null){
				_showWrongImportedFileDialog(true);
				return false;
			}

			//Reset
			$.fancybox.close();
			//Remove slides
			$('article[type="' + SM.Constant.SCREEN + '"]').remove();
			SM.Editor.Marker.resetData();
			SM.Utils.resetIds();

			//Prepare options for import
			initOptions.importedScene = true;
			initOptions.scene = scene;
			if((typeof initOptions.configuration === "object")&&(typeof SM.UploadScenePath === "string")){
				initOptions.configuration.UploadScenePath = SM.UploadScenePath;
			}

			_initWithOptions(initOptions);
		}
	};

	var importSceneFromJSONFancybox = function(){
		$("#importSceneFancybox").trigger('click');
	};

	var onImportFileChange = function (e) {
		const fileInput = e.target;
		const file = fileInput.files[0];
		if (!file) return;

		if (!file.name.endsWith(".json")) {
			fileInput.value = "";
			return _showWrongImportedFileDialog(false);
		}
		$("#import_file_button").show();
	};

	var _showWrongImportedFileDialog = function(parsed){
		var options = {};
		options.width = 650;
		options.height = 220;
		if(parsed===true){
			options.text = SM.I18n.getTrans("i.WrongResource");
		} else {
			options.text = SM.I18n.getTrans("i.WrongImportedFile");
		}
		var button1 = {};
		button1.text = SM.I18n.getTrans("i.Ok");
		button1.callback = function(){
			$.fancybox.close();
		}
		options.buttons = [button1];
		SM.Utils.showDialog(options);
	}

	//////////////////
	///  Getters and Setters
	//////////////////

	var getOptions = function(){
		return initOptions;
	};

	var getCurrentElementType = function(){
		var currentArea = getCurrentArea();
		if((typeof currentArea !== "undefined")&&(currentArea !== null)){
			return "ZONE";
		}
		var currentHotspot = SM.Editor.Marker.getCurrentHotspot();
		if((typeof currentHotspot !== "undefined")&&(currentHotspot !== null)){
			return "HOTSPOT";
		}
		var currentHotzoneId = SM.Editor.Marker.getCurrentHotzoneId();
		if((typeof currentHotzoneId !== "undefined")&&(currentHotzoneId !== null)){
			return "HOTZONE";
		}
		return "NONE";
	};
	
	var getCurrentArea = function() {
		if(currentZone){
			return currentZone;
		}
		return null;
	};
	
	var setCurrentArea = function(area){
		if($(area).attr("id")!=$(currentZone).attr("id")){
			lastZone = currentZone;
			currentZone = area;
		}
	};

	var getLastArea = function(){
		if(lastZone){
			return lastZone;
		}
		return null;
	};

	var getCurrentContainer = function(){
		return currentContainer;
	};

	var setCurrentContainer = function(container){
		currentContainer = container;
	};

	var isZoneEmpty = function(zone){
		return ((zone)&&($(zone).find(".delete_content").length===0));
	};

	var getContentAddMode = function(){
		return contentAddModeForSlides;
	};

	var setContentAddMode = function(mode){
		contentAddModeForSlides = mode;
	};

	var hasSceneChanged = function(){
		try {
			var objectToCompare;
			if(typeof lastStoredSceneStringify != "undefined"){
				objectToCompare = lastStoredSceneStringify;
			} else if(typeof initialScene != "undefined"){
				objectToCompare = JSON.stringify(initialScene);
			} else {
				return true;
			}

			var currentScene = SM.Editor.saveScene();
			return !(objectToCompare === JSON.stringify(currentScene));
		} catch (e){
			return true;
		}
	};

	return {
		init						: init,
		getOptions					: getOptions,
		getCurrentElementType 		: getCurrentElementType,
		getCurrentArea				: getCurrentArea,
		setCurrentArea				: setCurrentArea,
		selectContentZone			: selectContentZone,
		getLastArea					: getLastArea,
		cleanArea					: cleanArea,
		getCurrentContainer			: getCurrentContainer,
		setCurrentContainer			: setCurrentContainer,
		getContentAddMode			: getContentAddMode,
		setContentAddMode			: setContentAddMode,
		isZoneEmpty					: isZoneEmpty,
		saveScene					: saveScene,
		sendScene					: sendScene,
		exportSceneToJSON			: exportSceneToJSON,
		importSceneFromJSON			: importSceneFromJSON,
		importSceneFromJSONFancybox : importSceneFromJSONFancybox,
		onImportFileChange			: onImportFileChange,
		onSlideEnterEditor 			: onSlideEnterEditor,
		onSlideLeaveEditor			: onSlideLeaveEditor,
		onViewThumbClicked			: onViewThumbClicked,
		onEditableClicked			: onEditableClicked,
		onSelectableClicked 		: onSelectableClicked,
		onNoSelectableClicked 		: onNoSelectableClicked,
		onDeleteItemClicked 		: onDeleteItemClicked,
		addDeleteButton				: addDeleteButton,
		hasSceneChanged				: hasSceneChanged
	};

}) (SceneMaker, jQuery);