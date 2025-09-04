VISH.Editor.Renderer = (function(V,$,undefined){
	
	var _isRendering;

	/**
	 * Function to initialize the renderer 
	 */
	var init = function(presentation){
		_isRendering = false;
		renderPresentation(presentation);
	};

	var renderPresentation = function(presentation){
		_isRendering = true;

		var screens = presentation.screens;
		for(var i=0;i<screens.length;i++){
			_renderScreen(screens[i]);
		}

		_isRendering = false;
	};

	var _renderScreen = function(screenJSON){
		var options = {};
		options.slideNumber = V.Slides.getSlidesQuantity()+1;
		options.screenId = (screenJSON.id).toString();
		var scaffold = V.Editor.Dummies.getScaffoldForSlide(screenJSON,options);

		if(scaffold){
			V.Editor.Slides.appendSlide(scaffold);
			V.Slides.updateSlides();
			V.Slides.lastSlide();  //important to get the browser to draw everything

			//Get screen in DOM
			var screenId = $(scaffold).attr("id");
			var scaffoldDOM = $("#"+screenId);

			//Draw views
			var views = screenJSON.views;
			if(views){
				var ssL = views.length;
				for(var i=0; i<ssL; i++){
					var viewJSON = views[i];
					_renderView(viewJSON, {screenDOM: scaffoldDOM, slideNumber: i+1});
				}
			}

			//Complete scaffold
			V.Editor.Screen.draw(screenJSON,scaffoldDOM);
		}
	};

	var _renderView = function(view,renderOptions){
		if(view.type === V.Constant.VIEW_CONTENT){
			_renderViewContent(view,renderOptions);
		} else if(view.type === V.Constant.VIEW_IMAGE){
			_renderViewImage(view,renderOptions);
		}
	};

	var _renderViewCommon = function(view,renderOptions){
		var scaffold = V.Editor.Dummies.getScaffoldForSlide(view,{slideNumber: renderOptions.slideNumber});
		V.Editor.Slides.appendView(renderOptions.screenDOM,scaffold);
	};

	var _renderViewImage = function(view,renderOptions){
		_renderViewCommon(view,renderOptions);
		var scaffoldDOM = $("#"+view.id);
		V.Editor.Screen.draw(view,scaffoldDOM);
	};

	var _renderViewContent = function(view,renderOptions){
		_renderViewCommon(view,renderOptions);
		var scaffoldDOM = $("#"+view.id);

		//Draw elements
		V.Utils.addTempShown(scaffoldDOM);
		
		var viewElementsLength = view.elements.length;
		for(var i=0; i<viewElementsLength; i++){
			var element = view.elements[i];
			var zoneId = element.id;
			var area = $("div#" + zoneId + "[areaid='" + element.areaid +"']");

			if(area.length === 0){
				continue;
			}

			//Save element settings
			if(element.settings){
				var serializedSettings = JSON.stringify(element.settings);
				$(area).attr("elSettings",serializedSettings);
			}

			if(element.type === V.Constant.TEXT){
				V.Editor.Text.launchTextEditor({}, area, element.body);  //in this case there is no event, so we pass a new empty object
			} else if(element.type === V.Constant.IMAGE){
				V.Editor.Image.drawImage(element.body, area, element.style, element.hyperlink, element.options);
			} else if(element.type === V.Constant.VIDEO){
				var options = [];
				options['poster'] = element.poster;
				options['autoplay'] = element.autoplay;
				V.Editor.Video.HTML5.drawVideo(V.Video.HTML5.getSourcesFromJSON(element), options, area, element.style);
			} else if(element.type === V.Constant.AUDIO){
				var options = [];
				options['autoplay'] = element.autoplay;
				V.Editor.Audio.HTML5.drawAudio(V.Audio.HTML5.getSourcesFromJSON(element), options, area, element.style);
			} else if(element.type === V.Constant.OBJECT){
				V.Editor.Object.drawObject(element.body, {area:area, style:element.style, zoomInStyle:element.zoomInStyle});
			}

			//Add tooltips to area
			var hideTooltip = true;
			if(V.Editor.isZoneEmpty(area)){
				hideTooltip = false;
				//Give class "editable" to the empty areas
				$(area).addClass("editable");
			}
			V.Editor.Tools.addTooltipToZone(area,hideTooltip);
		}

		V.Utils.removeTempShown(scaffoldDOM);
	};

	var isRendering = function(){
		return _isRendering;
	};


	return {
		init				: init,
		renderPresentation	: renderPresentation,
		isRendering			: isRendering
	};

}) (VISH, jQuery);