SceneMaker.Viewer = (function(SM,$,undefined){

	//Initial options
	var initOptions;
	//Pointer to the current scene
	var current_scene;

	/**
	 * Function to initialize the Viewer
	 */
	var init = function(){
		_init(SM.getOptions())
	};

	var _init = function(options){
		SM.Editing = false;
		$("body").addClass("SceneMakerViewerBody");
		
		initOptions = (typeof options == "object") ? options : {};

		SM.Debugging.init(options);
		
		if((initOptions["configuration"])&&(SM.Configuration)){
			SM.Configuration.init(initOptions["configuration"]);
		}

		var scene = options.scene;
		SM.Utils.init();
		SM.I18n.init(initOptions,scene);

		SM.Debugging.log("\n\nScene Maker initiated with scene:\n"); 
		SM.Debugging.log(JSON.stringify(scene));

		scene = SM.Utils.fixScene(scene);
		if(scene===null){
			SM.Utils.showPNotValidDialog();
			return;
		}
		current_scene = scene;
		
		SM.Status.init();
		SM.ViewerAdapter.applyLanguageCSS();
		SM.EventsNotifier.init();
		SM.Object.init();
		SM.Screen.init();
		SM.View.init();
		SM.Marker.init();
		SM.Actions.init(scene);
		SM.Caption.init();
		SM.Slides.init();
		SM.I18n.translateUI();
		SM.User.init(options);
		SM.Events.init();
		SM.Video.init();
		SM.Audio.init();
		SM.FullScreen.init();
		SM.Scene.init(scene, function(){
			_initAferRenderScene(options,scene);
		});
	};

	var _initAferRenderScene = function(options,scene){
		SM.Video.HTML5.setMultimediaEvents();
		SM.Screen.updateCurrentScreenFromHash();
		SM.Screen.updateScreens();
		SM.ViewerAdapter.init(options);
		SM.Utils.Loader.preloadResources(scene);

		if(SM.Screen.getCurrentScreenNumber()>0){
			SM.Slides.triggerSlideEnterEvent($(SM.Screen.getCurrentScreen()).attr("id"));
		}

		if(!SM.Status.isExternalDomain()){
			//Try to win focus
			window.focus();
		}

		//Init Escapp client
		SM.Escapp.init(options,scene);
	};

	var getOptions = function(){	
		return initOptions;
	};

	var onSlideEnterViewer = function(e){
		var slide = e.target;
		var isView = SM.Slides.isView(slide);

		//Prevent parent to trigger onSlideEnterViewer
		//Use to prevent screens to be called when enter in one of their views
		e.stopPropagation();

		//Load objects
		if(isView){
			var $slide = $(slide);
			if($slide.hasClass(SM.Constant.OBJECT)){
				setTimeout(function(){
					//Prevent objects to load when the view isn't focused
					var cView = SM.View.getCurrentView();
					if((cView !== null)&&($(cView).attr("id") === $slide.attr("id"))){
						SM.ObjectPlayer.loadObject($slide);
					}
				}, 0);
			}
			SM.Video.HTML5.playMultimedia(slide);
		} else {
			//isScreen
			SM.Screen.onEnterScreen(slide);
		}

		//Check actions
		SM.Actions.checkActionsForSlideEnterEvent(slide.id);
	};

	var onSlideLeaveViewer = function(e){
		var slide = e.target;
		var isView = SM.Slides.isView(slide);

		e.stopPropagation();

		if(isView){
			var $slide = $(slide);
			if($slide.hasClass(SM.Constant.OBJECT)){
				setTimeout(function(){
					// Prevent object to be unload if the view is focused
					var cView = SM.View.getCurrentView();
					if((cView === null)||($(cView).attr("id") !== $slide.attr("id"))){
						SM.ObjectPlayer.unloadObject($slide);
					}
				}, 800);
			}
			SM.Video.HTML5.stopMultimedia(slide);
		} else {
			//isScreen
			SM.Screen.onLeaveScreen(slide);
		}
	};
	
	var getCurrentScene = function(){
		return current_scene;
	};

	return {
		init 						: init, 
		getOptions					: getOptions,
		getCurrentScene				: getCurrentScene,
		onSlideEnterViewer			: onSlideEnterViewer,
		onSlideLeaveViewer			: onSlideLeaveViewer
	};

}) (SceneMaker,jQuery);