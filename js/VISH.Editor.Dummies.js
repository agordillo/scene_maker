VISH.Editor.Dummies = (function(V,undefined){

	var init = function(){
	};

	var getDummy = function(slideType, options){
		switch(slideType){
			case V.Constant.SCREEN:
				return _getScreenDummy(options);
			break;
			case V.Constant.VIEW_IMAGE:
				return _getViewImageDummy(options);
			break;
			case V.Constant.VIEW_CONTENT:
				return _getViewContentDummy(options);
			break;
		}
	};

	var _getScreenDummy = function(options){
		var screenId = V.Utils.getId("article");
		return "<article id='"+screenId+"' type='"+V.Constant.SCREEN+"' slidenumber='"+options.slideNumber+"'><div class='change_bg_button'></div></article>";
	};

	var _getViewContentDummy = function(options){
		var screenId = $(options.screen).attr("id");
		var viewId = V.Utils.getId(screenId + "_article");
		var slideNumber = $(options.screen).find("article").length + 1;
		var dummy = "<article id='article_id_to_change' type='" + V.Constant.VIEW_CONTENT +"' template='t10' slidenumber='slidenumber_to_change'><div id='div_id_to_change' areaid='center' size='large' class='t10_center editable vezone selectable'></div></article>";
		return _replaceIds(dummy, slideNumber, viewId);
	};

	var _getViewImageDummy = function(options){
		var screenId = $(options.screen).attr("id");
		var viewId = V.Utils.getId(screenId + "_article");
		var slideNumber = $(options.screen).find("article").length + 1;
		return "<article id='"+viewId+"' type='"+V.Constant.VIEW_IMAGE+"' slidenumber='"+slideNumber+"'><div class='change_bg_button'></div></article>";
	};


	////////////
	// Scaffolds: used to render slides from JSON files
	////////////

	/*
	 * Function to get the scaffold of an existing slide in string format
	 * slide: slide in JSON format
	 */

	var getScaffoldForSlide = function(slideJSON,options){
		var slideType = V.Slides.getSlideType(slideJSON);
		var isScreen = V.Screen.isScreen(slideType);
		if(isScreen){
			var dummy = _getScreenDummy(slideJSON.id, options);
			if(dummy){
				return _removeEditable(_replaceIds(dummy, options.slideNumber, slideJSON.id));
			}
		} else if(slideType==V.Constant.VIEW){
			return _getScaffoldForView(slideJSON,options);
		}
	};

	var _getScaffoldForView = function(slideJSON,options){
		var zoneIds = [];
		for(el in slideJSON.elements){
			zoneIds.push(slideJSON.elements[el].id);
		}
		var dummy = dummies[parseInt(options.template,10)-1];
		return _removeEditable(_replaceIds(dummy, options.slideNumber, slideJSON.id, zoneIds));
	};

	/**
	 * Function to replace dummy ids
	 */
	var _replaceIds = function(dummy, slideNumber, articleId, zoneIds){
		var newDummy = dummy;
		var nextZoneId = 0;

		if(!articleId){
			articleId = V.Utils.getId("article");
		} else {
			V.Utils.registerId(articleId);
		}

		if(newDummy.indexOf("article_id_to_change") != -1){
			newDummy = newDummy.replace("article_id_to_change", articleId);			
		}
		
		if(newDummy.indexOf("slidenumber_to_change") != -1){
			newDummy = newDummy.replace("slidenumber_to_change", slideNumber);
		}

		while(newDummy.indexOf("div_id_to_change") != -1){
			if(zoneIds){
				var newZoneId = zoneIds[nextZoneId];
				nextZoneId++;
				V.Utils.registerId(newZoneId);
			} else {
				var newZoneId = V.Utils.getId(articleId + "_zone");
			}
			newDummy = newDummy.replace("div_id_to_change", newZoneId);
		}

		return newDummy;
	};

	var _removeEditable = function(dummy){
		return dummy.replace(/editable /g,"");
	};

	return {
		init				: init,
		getDummy			: getDummy,
		getScaffoldForSlide : getScaffoldForSlide
	};

}) (VISH);