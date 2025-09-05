VISH.Renderer = (function(V,$,undefined){
	
	var init  = function(){
		V.Renderer.Filter.init();
	}

	var renderScreen = function(screenJSON){
		var screenDOM = _renderScreen(screenJSON);
		if(screenDOM){
			$('section.slides').append($(screenDOM));
			V.Screen.draw(screenJSON);
			//Draw views with type VIEWS_IMAGE
			var viewsL = screenJSON.views.length;
			for(var i=0; i<viewsL; i++){
				var viewJSON = screenJSON.views[i];
				V.Screen.draw(viewJSON);
			}
		}
	};

	var _renderScreen = function(screenJSON){
		var allViews = "";
		var viewsL = screenJSON.views.length;
		for(var i=0; i<viewsL; i++){
			var view = screenJSON.views[i];
			allViews += _renderView(view);
		}
		return $("<article type='"+screenJSON.type+"' id='"+screenJSON.id+"'>"+allViews+"</article>");
	};

	var _renderView = function(view){
		if(view.type === V.Constant.VIEW_CONTENT){
			return _renderViewContent(view);
		} else if(view.type === V.Constant.VIEW_IMAGE){
			return _renderViewImage(view);
		}
	};

	var _renderViewImage = function(view){
		var classes = "hide_in_screen";
		var buttons = "<div class='close_view' id='close"+view.id+"'></div>";
		return "<article class='"+ classes +"' type='"+V.Constant.VIEW_IMAGE+"' id='"+view.id+"'>"+ buttons +"</article>";
	};

	var _renderViewContent = function(view){
		var content = "";
		var classes = "hide_in_screen";
		var buttons = "<div class='close_view' id='close"+view.id+"'></div>";

		var elL = view.elements.length;
		for(var i=0; i<elL; i++){
			var element = view.elements[i];

			if(!V.Renderer.Filter.allowElement(element)){
				content += V.Renderer.Filter.renderContentFiltered(element);
			} else if(element.type === V.Constant.TEXT){
				content += _renderText(element);
			} else if(element.type === V.Constant.IMAGE){
				content += _renderImage(element);
			} else if(element.type === V.Constant.VIDEO){
				content += _renderHTML5Video(element);
			} else if(element.type === V.Constant.AUDIO){
				content += _renderHTML5Audio(element);
			} else if(element.type === V.Constant.OBJECT){
				content += _renderObject(element);
				classes += " object";
			} else {
				content += _renderEmpty(element);
			}
		}

		return "<article class='"+ classes +"' type='"+V.Constant.VIEW_CONTENT+"' id='"+view.id+"'>"+ buttons + content+"</article>";
	};


	/*
	 * Render elements
	 */

	var _renderEmpty = function(element){
		var template = "view_content";
		return "<div id='"+element['id']+"' class='"+template+"_"+element['areaid']+" "+template+"_text"+"'></div>";
	};

	var _renderText = function(element){
		var template = "view_content";
		return "<div id='"+element['id']+"' class='VEtextArea "+template+"_"+element['areaid']+" "+template+"_text"+"'>"+element['body']+"</div>";
	};
	
	var _renderImage = function(element){
		var template = "view_content";
		if(typeof element['style'] == "undefined"){
			style = "max-height: 100%; max-width: 100%;";
		} else {
			style = element['style'];
		}

		var div = $("<div id='"+element['id']+"' class='"+template+"_"+element['areaid']+"'></div>");
		var img = $("<img class='"+template+"_image' src='"+element['body']+"' style='"+style+"' />");

		if(element['hyperlink']){
			var a = $("<a href='" + element['hyperlink'] + "' target='blank_'></a>");
			$(a).append(img);
			$(div).append(a);
		} else {
			$(div).append(img);
		}
		
		return V.Utils.getOuterHTML(div);
	};
	
	var _renderHTML5Video = function(videoJSON){
		var template = "view_content";
		var rendered = "<div id='"+videoJSON['id']+"' class='"+template+"_"+videoJSON['areaid']+"'>";
		var video = V.Video.HTML5.renderVideoFromJSON(videoJSON,{id: V.Utils.getId(videoJSON['id'] + "_video"),extraClasses: [template + "_video"], timestamp: true});
		rendered = rendered + video + "</div>";
		return rendered;
	};

	var _renderHTML5Audio = function(audioJSON){
		var template = "view_content";
		var rendered = "<div id='"+audioJSON['id']+"' class='"+template+"_"+audioJSON['areaid']+"'>";
		var audio = V.Audio.HTML5.renderAudioFromJSON(audioJSON,{id: V.Utils.getId(audioJSON['id'] + "_audio"),extraClasses: [template + "_audio"], timestamp: true});
		rendered = rendered + audio + "</div>";
		return rendered;
	};
	
	var _renderObject = function(element){
		var template = "view_content";
		var objectSettings = element.settings || {};
		var loadingObjectClass = (objectSettings.unloadObject===false) ? "unloadableObject" : "";
		
		var objectInfo = V.Object.getObjectInfo(element.body);

		switch(objectInfo.type){
			case V.Constant.MEDIA.YOUTUBE_VIDEO:
				return V.Video.Youtube.renderVideoFromJSON(element,{extraClasses: "objectelement youtubeelement " + loadingObjectClass + " " + template + "_" + element['areaid']});
				break;
			case V.Constant.MEDIA.PDF:
				return V.Object.PDF.renderPDFFromJSON(element,{extraClasses: loadingObjectClass + " " + template +"_" + element['areaid'], source: objectInfo.source});
				break;
			default:
				var style = (element['style'])? element['style'] : "";
				var body = V.Utils.checkUrlProtocolInStringTag(element['body']);
				var zoomInStyle = (element['zoomInStyle'])? element['zoomInStyle'] : "";
				return "<div id='"+ element['id'] +"' class='objectelement " + loadingObjectClass + " " + template + "_" + element['areaid'] + "' objectStyle='" + style + "' zoomInStyle='" + zoomInStyle + "' objectWrapper='" + body + "'>" + "" + "</div>";
				break;
		}
	};

	return {
		init        		: init,
		renderScreen 		: renderScreen
	};

}) (VISH,jQuery);

