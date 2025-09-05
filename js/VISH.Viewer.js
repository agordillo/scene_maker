VISH.Viewer = (function(V,$,undefined){

	//Initial options
	var initOptions;
	//Pointer to the current presentation
	var current_presentation;

	/**
	 * Function to initialize the Viewer
	 */
	var init = function(options, presentation){
		V.Editing = false;
		$("body").addClass("SceneMakerViewerBody");
		
		initOptions = (typeof options == "object") ? options : {};

		V.Debugging.init(options);
		
		if((initOptions["configuration"])&&(V.Configuration)){
			V.Configuration.init(initOptions["configuration"]);
		}

		if(V.Debugging.isDevelopping()){
			if ((!presentation)&&(V.Debugging.getPresentationSamples()!==null)){
			 	presentation = V.Debugging.getPresentationSamples();
			}
		}

		V.Utils.init();
		V.I18n.init(initOptions,presentation);

		V.Debugging.log("\n\nScene Maker init with scene:\n"); 
		V.Debugging.log(JSON.stringify(presentation));

		presentation = V.Utils.fixPresentation(presentation);
		if(presentation===null){
			V.Utils.showPNotValidDialog();
			return;
		}
		current_presentation = presentation;
		
		V.Status.init(function(){
			//Status loading finishes
			_initAferStatusLoaded(options,presentation);
		});
	};

	var _initAferStatusLoaded = function(options,presentation){
		V.Utils.Loader.loadDeviceCSS();
		V.Utils.Loader.loadLanguageCSS();
		V.EventsNotifier.init();
		V.Object.init();
		V.Screen.init();
		V.Slides.init();
		V.I18n.translateUI();
		V.User.init(options);
		V.Storage.init();
		V.Events.init();
		V.Video.init();
		V.Audio.init();
		V.FullScreen.init();
		V.Presentation.init(presentation, function(){
			_initAferRenderPresentation(options,presentation);
		});
	};

	var _initAferRenderPresentation = function(options,presentation){
		V.Video.HTML5.setMultimediaEvents();
		V.Slides.updateCurrentSlideFromHash();
		V.Slides.updateSlides();
		V.ViewerAdapter.init(options);

		if(V.Slides.getCurrentScreenNumber()>0){
			V.Slides.triggerEnterEventById($(V.Slides.getCurrentScreen()).attr("id"));
		}

		if(!V.Status.isExternalDomain()){
			//Try to win focus
			window.focus();
		}
	};

	
	var getOptions = function(){	
		return initOptions;
	};

	/**
	* Function called when entering slide in viewer, we have to show the objects
	*/
	var onSlideEnterViewer = function(e){
		var slide = e.target;
		var cSlideNumber = V.Slides.getCurrentScreenNumber();
		var isSubslide = V.Slides.isSubslide(slide);
		var isSlideset = ((!isSubslide)&&(V.Screen.isScreen(slide)));

		//Prevent parent to trigger onSlideEnterViewer
		//Use to prevent slidesets to be called when enter in one of their subslides
		e.stopPropagation();

		var timeToLoadObjects = 500;

		setTimeout(function(){
			if(!isSubslide){
				if(cSlideNumber!==V.Slides.getCurrentScreenNumber()){
					//Prevent objects to load when the slide isn't focused
					return;
				}
			}
			if(!isSlideset){
				if($(slide).hasClass(V.Constant.OBJECT)){
					V.ObjectPlayer.loadObject($(slide));
				}
				if($(slide).hasClass(V.Constant.SNAPSHOT)){
					V.SnapshotPlayer.loadSnapshot($(slide));
				}
			}
		},timeToLoadObjects);

		if(!isSlideset){
			V.Video.HTML5.playMultimedia(slide);
		}

		if(isSlideset){
			V.Screen.onEnterSlideset(slide);
		}

		V.EventsNotifier.notifyEvent(V.Constant.Event.onEnterSlide,{"id": slide.id, "slideNumber": cSlideNumber},false);
	};

	/**
	* Function called when leaving a slide in viewer
	*/
	var onSlideLeaveViewer = function(e){
		var slide = e.target;
		var isSubslide = V.Slides.isSubslide(slide);
		var isSlideset = ((!isSubslide)&&(V.Screen.isScreen(slide)));

		e.stopPropagation();

		if(!isSlideset){
			if($(slide).hasClass(V.Constant.OBJECT)){
				V.ObjectPlayer.unloadObject($(slide));
			} else if($(slide).hasClass(V.Constant.SNAPSHOT)){
				V.SnapshotPlayer.unloadSnapshot($(slide));
			}
			V.Video.HTML5.stopMultimedia(slide);
		} else {
			V.Screen.onLeaveSlideset(slide);
		}
	};
	
	var getCurrentPresentation = function(){
		return current_presentation;
	};

	return {
		init 						: init, 
		getOptions					: getOptions,
		getCurrentPresentation		: getCurrentPresentation,
		onSlideEnterViewer			: onSlideEnterViewer,
		onSlideLeaveViewer			: onSlideLeaveViewer
	};

}) (VISH,jQuery);