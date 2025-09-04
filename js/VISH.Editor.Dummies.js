VISH.Editor.Dummies = (function(V,undefined){

	var init = function(){
	};

	var getDummy = function(slideType, options){
		switch(slideType){
			case V.Constant.SCREEN:
				if(typeof options.screenId === "undefined"){
					options.screenId = V.Utils.getId("article");
				}
				return _getScreenDummy(options);
			case V.Constant.VIEW_IMAGE:
				if(typeof options.viewId === "undefined"){
					options.viewId = V.Utils.getId(options.screenId + "_article");
				}
				return _getViewImageDummy(options);
			case V.Constant.VIEW_CONTENT:
				if(typeof options.viewId === "undefined"){
					options.viewId = V.Utils.getId(options.screenId + "_article");
				}
				return _getViewContentDummy(options);
		}
	};

	var _getScreenDummy = function(options){
		var dummy = "<article id='article_id_to_change' type='"+V.Constant.SCREEN+"' slidenumber='slidenumber_to_change'><div class='change_bg_button'></div></article>";
		return _replaceIds(dummy, options.slideNumber, options.screenId);
	};

	var _getViewImageDummy = function(options){
		var dummy = "<article id='article_id_to_change' type='"+V.Constant.VIEW_IMAGE+"' slidenumber='slidenumber_to_change'><div class='change_bg_button'></div></article>";
		return _replaceIds(dummy, options.slideNumber, options.viewId);
	};

	var _getViewContentDummy = function(options){
		var dummy = "<article id='article_id_to_change' type='" + V.Constant.VIEW_CONTENT +"' template='t10' slidenumber='slidenumber_to_change'><div id='div_id_to_change' areaid='center' size='large' class='t10_center editable vezone selectable'></div></article>";
		return _replaceIds(dummy, options.slideNumber, options.viewId, options.zoneIds);
	};


	////////////
	// Scaffolds: used to render slides from JSON files
	////////////

	/*
	 * Function to get the scaffold of an existing slide in string format
	 * slide: slide in JSON format
	 */

	var getScaffoldForSlide = function(slideJSON,options){
		switch(slideJSON.type){
			case V.Constant.SCREEN:
				return _getScaffoldForScreen(slideJSON,options);
			case V.Constant.VIEW_IMAGE:
				return _getScaffoldForViewImage(slideJSON,options);
			case V.Constant.VIEW_CONTENT:
				return _getScaffoldForViewContent(slideJSON,options);
		}
	};

	var _getScaffoldForScreen = function(slideJSON,options){
		options.screenId = slideJSON.id;
		return _getScreenDummy(options);	
	};

	var _getScaffoldForViewImage = function(slideJSON,options){
		options.viewId = slideJSON.id;
		return _getViewImageDummy(options);
	};

	var _getScaffoldForViewContent = function(slideJSON,options){
		options.viewId = slideJSON.id;

		var zoneIds = [];
		for(el in slideJSON.elements){
			zoneIds.push(slideJSON.elements[el].id);
		}
		options.zoneIds = zoneIds;

		var dummy = _getViewContentDummy(options);

		//Remove editable
		dummy = dummy.replace(/editable /g,"");

		return dummy;
	};

	/**
	 * Function to replace dummy ids
	 */
	var _replaceIds = function(dummy, slideNumber, slideId, zoneIds){
		var newDummy = dummy;
		var nextZoneId = 0;

		if(typeof slideId !== "undefined"){
			V.Utils.registerId(slideId);
		} else {
			return;
		}
		
		//SlideId
		if(newDummy.indexOf("article_id_to_change") != -1){
			newDummy = newDummy.replace("article_id_to_change", slideId);			
		}
		
		//Slide number
		if(newDummy.indexOf("slidenumber_to_change") != -1){
			newDummy = newDummy.replace("slidenumber_to_change", slideNumber);
		}

		//Zones
		while(newDummy.indexOf("div_id_to_change") != -1){
			if(zoneIds){
				var newZoneId = zoneIds[nextZoneId];
				nextZoneId++;
				V.Utils.registerId(newZoneId);
			} else {
				var newZoneId = V.Utils.getId(slideId + "_zone");
			}
			newDummy = newDummy.replace("div_id_to_change", newZoneId);
		}

		return newDummy;
	};

	return {
		init				: init,
		getDummy			: getDummy,
		getScaffoldForSlide : getScaffoldForSlide
	};

}) (VISH);