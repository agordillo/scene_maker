SceneMaker.Marker = (function(SM,$,undefined){
	var slideData;
	var hotspotData;
	var hotzoneData;
	var renderedAnnotations;
	var defaultHotspotImg;

	var init = function(){
		slideData = {};
		hotspotData = {};
		hotzoneData = {};
		renderedAnnotations = new Set();
		defaultHotspotImg = SM.ImagesPath + "hotspotgallery/hotspot.png";
	};

	var getDefaultHotspotImg = function(){
		return defaultHotspotImg;
	};

	var drawSlideWithMarkers = function(slideJSON){
		var $slide = $("#" + slideJSON.id);

		//Background image
		if(typeof slideJSON.background === "string"){
			var imgBackgroundId = slideJSON.id + "_background";
			var imgBackground = $("<img>", {
				id: imgBackgroundId,
				class: "slide_background",
				src: slideJSON.background
			});
			$slide.append(imgBackground);

			// imgBackground.on('load', function() {
				//Hotzones
				if (Array.isArray(slideJSON.hotzones)&&(slideJSON.hotzones.length > 0)){
					for(j in slideJSON.hotzones){
						_drawHotzone($slide, slideJSON.hotzones[j]);
					}
				}

				//Hotspots
				if (Array.isArray(slideJSON.hotspots)&&(slideJSON.hotspots.length > 0)){
					for(i in slideJSON.hotspots){
						_drawHotspot($slide, slideJSON.hotspots[i]);
					}
				}
			// });
		}

		//Caption
		if (typeof slideJSON.caption !== "undefined"){
			SM.Caption.drawCaption($slide, slideJSON.caption);
		}
	};

	var _drawHotspot = function($slide, hotspotJSON){
		if((!hotspotJSON)||(!hotspotJSON.id)){
			return;
		}
		var coordinatesMargin = 10;
		if(!hotspotJSON.x){
			return;
		}
		if(!hotspotJSON.y){
			return;
		}
		if((!hotspotJSON.width)||(hotspotJSON.width <= 0)){
			return;
		}
		if((!hotspotJSON.height)||(hotspotJSON.height <= 0)){
			return;
		}
		if(typeof hotspotJSON.image !== "string"){
			hotspotJSON.image = defaultHotspotImg;
		}

		var rotationAngle = parseFloat(hotspotJSON.rotationAngle);
		if (typeof rotationAngle !== "number" || isNaN(rotationAngle) || rotationAngle < 0 || rotationAngle > 360) {
			rotationAngle = 0;
		}

		var extraClasses = "";
		var visible = (hotspotJSON.visibility !== "hidden");
		if(visible === false){
			extraClasses += " hotspot_hidden";
		}
		var cursorVisible = (hotspotJSON.cursorVisibility === "pointer");
		if(cursorVisible === true){
			extraClasses += " hotspot_cursor_pointer";
		}

		var $imgBackground = SM.Slides.getSlideBackgroundImg($slide);
		var $hotspot = $('<img>', {
			src: hotspotJSON.image,
			class: ('hotspot' + extraClasses),
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
		}).appendTo($imgBackground.parent());

		if (Array.isArray(hotspotJSON.actions)&&(hotspotJSON.actions.length > 0)) {
			$hotspot.addClass("hotspot_with_actions");
			
			hotspotData[hotspotJSON.id] = hotspotJSON;
			$hotspot.on('click', function(){
				_onClickHotspot(hotspotJSON.id);
			});

			for(i in hotspotJSON.actions){
				SM.Actions.addActionToHotspot($hotspot, hotspotJSON.actions[i]);
			}
		}
	};

	var _drawHotzone = function($slide, hotzoneJSON, redraw=false){
		if((!hotzoneJSON)||(!hotzoneJSON.id)){
			return;
		}
		if(!Array.isArray(hotzoneJSON.points)){
			return;
		}
		if (!Array.isArray(hotzoneJSON.actions) || (hotzoneJSON.actions.length < 1)) {
			return;
		}

		var slideId = $slide.attr("id");
		hotzoneJSON.slideId = slideId;
		var hotzoneId = hotzoneJSON.id;
		hotzoneData[hotzoneId] = hotzoneJSON;
		var annotator = _createAnnotatorForSlide(slideId);

		if(hotzoneJSON.enabled === false){
			//Do not draw disabled hotzones until enabled
			return;
		}

		var annotation = createAnnotationFromPointsArray(hotzoneId,hotzoneJSON.points);
		annotator.addAnnotation(annotation);
		
		_waitForAnnotationRenderingAfterDrawing(annotation.id, function(hotzoneDOM){
			if(redraw===true){
				_restoreAnnotationsAfterAnnotatorChange(slideId);
			} else {
				_restoreAnnotationAfterAnnotatorChange(annotation.id,$(hotzoneDOM));
			}
			renderedAnnotations.add(annotation.id);
		});
	};

	var _waitForAnnotationRenderingAfterDrawing = function(annotationId, callback) {
		var initTime = Date.now();
		var timer = null;
		var resolved = false;

		function finish($hotzoneDOM) {
			if (resolved) return;
			resolved = true;
			if (timer) {
				clearInterval(timer);
			}
			callback($hotzoneDOM);
		}

		function check() {
			var $hotzoneDOM = getHotzoneDOM(annotationId);
			if ($hotzoneDOM.length > 0) {
				finish($hotzoneDOM);
				return true;
			}
			if (Date.now() - initTime >= 1500) {
				if (timer) {
					clearInterval(timer);
				}
			}
			return false;
		}
		if (!check()) {
			timer = setInterval(check, 200);
		}
	};

	var _createAnnotatorForSlide = function(slideId){
		if(typeof slideData[slideId] === "undefined"){
			slideData[slideId] = {};
		}
		if(typeof slideData[slideId].annotator !== "undefined"){
			return slideData[slideId].annotator; //already created
		}

		var $imgBackground = SM.Slides.getSlideBackgroundImg($("#" + slideId));
		var annotator = Annotorious.createImageAnnotator($imgBackground.attr("id"), {
			drawingEnabled: false,
			userSelectAction: 'SELECT',
			style: {
				fill: '#dddddd00',
				fillOpacity: 0,
				stroke: '#00000000',
				strokeWidth: 1
			}
			//For testing
			// style: {
			// 	fill: '#dddddd',
			// 	fillOpacity: 0.25,
			// 	stroke: '#000000',
			// 	strokeWidth: 1
			// }
		});
		annotator.on('selectionChanged', function(annotations){
			if(Array.isArray(annotations)){
				if (annotations.length === 1){
					_onClickHotzone(annotations[0].id);
				}
			}
		});
		annotator.on('deleteAnnotation', function(annotation){
			if((typeof hotzoneData[annotation.id] === "undefined")||(typeof hotzoneData[annotation.id].slideId === "undefined")) return;
			renderedAnnotations.delete(annotation.id);
			_restoreAnnotationsAfterAnnotatorChange(hotzoneData[annotation.id].slideId);
		});
		
		slideData[slideId].annotator = annotator;
		return annotator;
	};

	var createAnnotationFromPointsArray = function(id, pointsArray){
		var xs = pointsArray.map(([x]) => x);
		var ys = pointsArray.map(([, y]) => y);
		var minX = Math.min(...xs);
		var maxX = Math.max(...xs);
		var minY = Math.min(...ys);
		var maxY = Math.max(...ys);

		var annotation = {
			"id": id,
			"target": {
				"selector": {
					"type": "POLYGON",
					"geometry": {
						"bounds": {
							"minX": minX,
							"minY": minY,
							"maxX": maxX,
							"maxY": maxY
						},
						"points": pointsArray
					}
				}
			}
		};
		return annotation;
	};

	var getHotzoneDOM = function(hotzoneId){
		return $("svg.a9s-annotationlayer g[data-id='" + hotzoneId + "']");
	};

	var _onClickHotspot = function(hotspotId){
		if((typeof hotspotData[hotspotId] !== "object")||(typeof hotspotData[hotspotId].actions === "undefined")){
			return;
		}
		SM.Actions.performActions(hotspotData[hotspotId].actions,hotspotId);
	};

	var _onClickHotzone = function(hotzoneId){
		if((typeof hotzoneData[hotzoneId] !== "object")||(typeof hotzoneData[hotzoneId].actions === "undefined")||(hotzoneData[hotzoneId].enabled === false)){
			return;
		}
		SM.Actions.performActions(hotzoneData[hotzoneId].actions,hotzoneData[hotzoneId].idAlias);
	};

	var enableHotzone = function(hotzoneId){
		if((typeof hotzoneData === "undefined")||(typeof hotzoneData[hotzoneId] === "undefined")){
			return;
		}
		var hotzoneJSON = hotzoneData[hotzoneId];
		if(hotzoneJSON.enabled === true){
			return;
		}
		if(typeof hotzoneJSON.slideId === "undefined"){
			return;
		}
		var $slide = $("#" + hotzoneJSON.slideId);
		if($slide.length !== 1){
			return;
		}
		hotzoneData[hotzoneId].enabled = true;
		_drawHotzone($slide, hotzoneData[hotzoneId], true);
	};

	var disableHotzone = function(hotzoneId){
		if((typeof hotzoneData === "undefined")||(typeof hotzoneData[hotzoneId] === "undefined")){
			return;
		}
		var hotzoneJSON = hotzoneData[hotzoneId];
		if(hotzoneJSON.enabled === false){
			return;
		}
		var slideId = hotzoneJSON.slideId;
		if(typeof slideId === "undefined"){
			return;
		}
		var $slide = $("#" + slideId);
		if($slide.length !== 1){
			return;
		}

		//Disable hotzone
		hotzoneData[hotzoneId].enabled = false;
		if(typeof slideData[slideId].annotator !== "undefined"){
			_waitForAnnotationRenderingBeforeDisabling(hotzoneId,function(){
				// Ensure the annotation is rendered before disabling in order to prevent an internal Annotorious crash.
				slideData[slideId].annotator.removeAnnotation(hotzoneId);
			});
		}
	};

	var _waitForAnnotationRenderingBeforeDisabling = function(annotationId, callback) {
		var initTime = Date.now();
		var timer = null;
		var resolved = false;

		function finish() {
			if (resolved) return;
			resolved = true;
			if (timer) {
				clearInterval(timer);
			}
			callback();
		}

		function check() {
			if(renderedAnnotations.has(annotationId)){
				finish();
				return true;
			}
			if (Date.now() - initTime >= 1500) {
				if (timer) {
					clearInterval(timer);
				}
			}
			return false;
		}
		if (!check()) {
			timer = setInterval(check, 200);
		}
	};

	var _restoreAnnotationsAfterAnnotatorChange = function(slideId){
		//Restore custom attributes in the annotation DOM elements on the slide.
		var $slide = $("#"+slideId);
		$slide.find("svg.a9s-annotationlayer g[data-id]").each(function(index, annotationDOM){
			var $annotationDOM = $(annotationDOM);
			var annotationId = $annotationDOM.attr("data-id");
			_restoreAnnotationAfterAnnotatorChange(annotationId,$annotationDOM);
		});
	};

	var _restoreAnnotationAfterAnnotatorChange = function(annotationId,$annotationDOM){
		if(typeof $annotationDOM.attr("hotzone_cursor_visibility") !== "undefined"){
			return;
		}
		if(typeof hotzoneData[annotationId] !== "undefined"){
			if(hotzoneData[annotationId].cursorVisibility === "pointer"){
				$annotationDOM.attr("hotzone_cursor_visibility",hotzoneData[annotationId].cursorVisibility);
			}
			for(i in hotzoneData[annotationId].actions){
				SM.Actions.refreshHotzoneAction($annotationDOM,hotzoneData[annotationId].actions[i]);
			}
		}
	}

	var updateHotzoneData = function(hotzoneId, key, value){
		if((typeof hotzoneData[hotzoneId] === "undefined")||(typeof key === "undefined")) return;
		hotzoneData[hotzoneId][key] = value;
	};

	return {
		init 							: init,
		getDefaultHotspotImg			: getDefaultHotspotImg,
		getHotzoneDOM					: getHotzoneDOM,
		drawSlideWithMarkers			: drawSlideWithMarkers,
		createAnnotationFromPointsArray : createAnnotationFromPointsArray,
		enableHotzone					: enableHotzone,
		disableHotzone					: disableHotzone,
		updateHotzoneData				: updateHotzoneData
	};

}) (SceneMaker, jQuery);