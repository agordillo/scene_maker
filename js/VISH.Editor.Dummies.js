VISH.Editor.Dummies = (function(V,undefined){

	var init = function(){
	};

	////////////
	// Dummies: used to create new slides
	////////////

	/*
	 * Function to get the dummy of a new slide
	 */
	var getDummy = function(slideType, options){
		console.log("Get dummy", slideType, options);
		var isScreen = V.Screen.isScreen(slideType);
		if(isScreen){
			return _getScreenDummy(options);
		} else if(slideType==V.Constant.VIEW){
			return _getViewDummy(options);
		}
	};

	var _getViewDummy = function(options){
		var slidesetId = $(options.slideset).attr("id");
		var subslideId = V.Utils.getId(slidesetId + "_article");
		var slideNumber = $(options.slideset).find("article").length + 1;
		var dummy = "<article id='article_id_to_change' type='view' template='t10' slidenumber='slidenumber_to_change'><div id='div_id_to_change' areaid='center' size='large' class='t10_center editable vezone selectable'></div></article>";
		return _replaceIds(dummy, slideNumber, subslideId);
	};

	var _getScreenDummy = function(options){
		var screenId = V.Utils.getId("article");
		return "<article id='"+screenId+"' type='"+V.Constant.SCREEN+"' slidenumber='"+options.slideNumber+"'><div class='change_bg_button'></div></article>";
	};


	////////////
	// Scaffolds: used to render slides from JSON files
	////////////

	/*
	 * Function to get the scaffold of an existing slide in string format
	 * slide: slide in JSON format
	 */

	var getScaffoldForSlide = function(slide,options){
		var slideType = V.Slides.getSlideType(slide);
		var isSlideset = V.Screen.isScreen(slideType);
		if(isSlideset){
			var dummy = _getScreenDummy(slide.id, options);
			if(dummy){
				return _removeEditable(_replaceIds(dummy, options.slideNumber, slide.id));
			}
		} else if(slideType==V.Constant.VIEW){
			return _getScaffoldForView(slide,options);
		}
	};

	var _getScaffoldForView = function(slide,options){
		var zoneIds = [];
		for(el in slide.elements){
			zoneIds.push(slide.elements[el].id);
		}
		var dummy = dummies[parseInt(options.template,10)-1];
		return _removeEditable(_replaceIds(dummy, options.slideNumber, slide.id, zoneIds));
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