VISH.Editor.Slides = (function(V,$,undefined){

	var updateCurrentSlideFromHash = function(){
		var slideNo = V.Utils.getSlideNumberFromHash();
		if(slideNo){
			V.Slides.setCurrentSlideNumber(slideNo);
		}
	};

	var showSlides = function(){
		$(".slides > article").removeClass("temp_hidden");
	};

	var hideSlides = function(){
		$(".slides > article").addClass("temp_hidden");
	};

	/**
	 * function to know if the slides have the focus or not
	 * Use to disable actions (like keyboard shortcuts) when the slide is not focused 
	 * @return false if other element has the focus
	 */
	var isSlideFocused = function(){
		//Wysiwyg is focused.
		if($(".wysiwygInstance").is(":focus")){
			return false;
		}
		
		//Fancybox is showing
		if($("#fancybox-content").is(":visible")){
			return false;
		}

		//Generic input is focused
		if($("input").is(":focus")){
			return false;
		}

		//An area is focused
		if(V.Editor && V.Editor.getCurrentArea()!==null){
			return false;
		}

		return true;
	};


	/* Subslide Movement (with keyboard) */

	/**
	 * Function to go to next subslide in a slideset
	 */
	var forwardOneSubslide = function(event){
		moveSubslides(1);
	};

   /**
	* Function to go to previous subslide in a slideset
	*/
	var backwardOneSubslide = function(){
		moveSubslides(-1);
	};

   /**
	* Function to move n subslides and change the thumbnails and focus
	* n > 0 (advance subslides)
	* n < 0 (go back)
	*/
	var moveSubslides = function(n){
		var cSlide = V.Slides.getCurrentScreen();
		if(!V.Screen.isScreen(cSlide)){
			return;
		}
		var cSubslideNumber = V.Slides.getCurrentViewNumber();
		if(typeof cSubslideNumber == "undefined"){
			cSubslideNumber = 0;
		}
		//Get subslides quantity
		var subslidesQuantity = V.Editor.Screen.getSubslidesQuantity(cSlide);

		var no = cSubslideNumber+n;
		var cno = Math.min(Math.max(0,no),subslidesQuantity);
		if(no===cno){
			goToSubslide(no);
		}
	};

   /**
	* Go to the subslide no
	*/
	var goToSubslide = function(no){
		if(no===0){
			//Select slideset
			V.Editor.Screen.onClickOpenSlideset();
		} else {
			V.Editor.Screen.openSubslideWithNumber(no);
		}
	};



	//Move and copy features

	/*
	 *	Move slide_to_move after or before reference_slide.
	 *  Movement param posible values: "after", "before"
	 */
	var moveSlideTo = function(orgPosition, destPosition){
		var slide_to_move = V.Slides.getSlideWithNumber(orgPosition);
		var reference_slide = V.Slides.getSlideWithNumber(destPosition);

		if((typeof slide_to_move === "undefined")||(typeof reference_slide === "undefined")){
			return;
		}

		if(typeof slide_to_move.length !== undefined){
			slide_to_move = $(slide_to_move)[0];
			if(typeof slide_to_move === "undefined"){
				return;
			}
		}

		if(typeof reference_slide.length !== undefined){
			reference_slide = $(reference_slide)[0];
			if(typeof reference_slide === "undefined"){
				return;
			}
		}

		if((slide_to_move.tagName!="ARTICLE")||(reference_slide.tagName!="ARTICLE")||(slide_to_move==reference_slide)){
			return;
		}

		//We must move slide orgPosition after or before destPosition
		var movement = null;
		if(destPosition > orgPosition){
			movement = "after";
		} else if(destPosition < orgPosition){
			movement = "before";
		} else {
			return;
		}

		var article_to_move = slide_to_move;
		var article_reference = reference_slide;

		var moving_current_slide = false;
		var currentSlide = V.Slides.getCurrentScreen();
		var oldCurrentSlideNumber = parseInt($(currentSlide).attr("slidenumber"));
		if(currentSlide === article_to_move){
			moving_current_slide = true;
		}

		var textAreas = copyTextAreasOfSlide(article_to_move);
		$(article_to_move).remove();
		if(movement=="after"){
			$(article_reference).after(article_to_move);
		} else if(movement=="before") {
			$(article_reference).before(article_to_move);
		} else {
			// V.Debugging.log("V.Slides: Error. Movement not defined... !");
			return;
		}

		V.Utils.addTempShown(article_to_move);

		//Refresh Draggable Objects
		if(V.Screen.isScreen(article_to_move)){
			V.Editor.Screen.refreshDraggables(article_to_move);
		}
		
		//Reload text areas
		_cleanTextAreas(article_to_move);
		_loadTextAreasOfSlide(article_to_move,textAreas);

		V.Utils.removeTempShown(article_to_move);

		//Update slideEls
		V.Slides.setSlides($('section.slides > article'));

		//Update scrollbar params and counters
		$("#slides_list").find("div.wrapper_slidethumbnail:has(img[slidenumber])").each(function(index,div){
			var slideNumber = index+1;
			var p = $(div).find("p.ptext_barbutton");
			$(p).html(slideNumber);
			var img = $(div).find("img.image_slidethumbnail");
			$(img).attr("slidenumber",slideNumber);
		});

		//Update current slide number
		var newCurrentSlideNumber;

		if(moving_current_slide){
			newCurrentSlideNumber = destPosition;
		} else {
			if((orgPosition > oldCurrentSlideNumber)&&(destPosition <= oldCurrentSlideNumber)){
				newCurrentSlideNumber = (oldCurrentSlideNumber+1);
			} else if((orgPosition < oldCurrentSlideNumber)&&(destPosition >= oldCurrentSlideNumber)){
				newCurrentSlideNumber = (oldCurrentSlideNumber-1);
			}
		}

		if(typeof newCurrentSlideNumber == "number"){
			V.Slides.setCurrentSlideNumber(newCurrentSlideNumber);
		}
		
		//Update slides classes next and past.
		//Current slide needs to be stablished before this call.
		V.Slides.updateSlides();
	}

	var copyScreen = function(slideToCopy,options){
		if(typeof slideToCopy == "undefined"){
			return;
		}

		/////////////////
		//Copy actions
		/////////////////

		_cleanTextAreas(slideToCopy);
		slideToCopy = _replaceIdsForCopyScreen(slideToCopy);
		var newId = $(slideToCopy).attr("id");

		var currentSlide = V.Slides.getCurrentScreen();
		if(currentSlide){
			$(currentSlide).after(slideToCopy);
		} else {
			$("section#slides_panel").append(slideToCopy);
		}
		
		/////////////////
		//Post-copy actions
		/////////////////
		var slideCopied = $("#"+newId);

		//Restore draggables
		if(V.Screen.isScreen(slideCopied)){
			V.Editor.Screen.refreshDraggables(slideCopied);
		}
		
		//Restore text areas
		if(options.textAreas){
			_loadTextAreasOfSlide(slideCopied,options.textAreas);
		}
		
		V.Slides.updateSlides();

		//Redraw thumbnails
		V.Editor.Thumbnails.redrawThumbnails(function(){
			if(currentSlide){
				V.Slides.goToSlide(V.Slides.getCurrentScreenNumber()+1);
				V.Editor.Thumbnails.moveThumbnailsToSlide(V.Slides.getCurrentScreenNumber());
			} else {
				V.Slides.goToSlide(1);
				V.Editor.Thumbnails.moveThumbnailsToSlide(1);
			}
		});
	};

	var _cleanTextAreas = function(slide){
		$(slide).find("div[type='text'],div.wysiwygTextArea").each(function(index,textArea){
			$(textArea).html("");
		});
	};

	var copyTextAreasOfSlide = function(slide){
		var textAreas = {};
		$(slide).find("div[type='text']").each(function(index,textArea){
			var areaId = $(textArea).attr("areaid");
			var ckEditor = V.Editor.Text.getCKEditorFromZone(textArea);
			if((areaId)&&(ckEditor!==null)){
				textAreas[areaId] = ckEditor.getData();
			}
		});
		return textAreas;
	};

	var _loadTextAreasOfSlide = function(slide,textAreas){
		var views = $(slide).find("article[type='" + V.Constant.VIEW_CONTENT + "']");
		V.Utils.addTempShown(slide);
		V.Utils.addTempShown(views);
		$(slide).find("div[type='text']").each(function(index,textArea){
			var areaId = $(textArea).attr("areaid");
			if((areaId)&&(textAreas[areaId])){
				var data = textAreas[areaId];
				V.Editor.Text.launchTextEditor({}, $(textArea), data);
			}
		});
		V.Utils.removeTempShown(views);
		V.Utils.removeTempShown(slide);
	};


	var _replaceIdsForCopyScreen = function(screen){
		var oldScreenId = $(screen).attr("id");
		var newScreenId  = V.Utils.getId("article");
		$(screen).attr("id",newScreenId);

		//Hotspots
		var hotspotIdsMapping = {};
		$(screen).children("img.hotspot").each(function(index, hotspot) {
			var oldHotspotId = $(hotspot).attr("id");
			var newHotspotId = V.Utils.getId("hotspot-");
			$(hotspot).attr("id",newHotspotId);
			hotspotIdsMapping[oldHotspotId] = newHotspotId;
		});
		// Copy hotspot config
		V.Editor.Screen.copyHotspotConfig(oldScreenId,newScreenId,hotspotIdsMapping);

		var views = $(screen).children("article");
		$(views).each(function(index, view) {
			_replaceIdsForCopyView(view,newScreenId,oldScreenId);
		});
		return screen;
	};

	var _replaceIdsForCopyView = function(view,newScreenId){
		switch($(view).attr("type")){
			case V.Constant.VIEW_IMAGE:
				return _replaceIdsForCopyViewImage(view,newScreenId);
			case V.Constant.VIEW_CONTENT:
				return _replaceIdsForCopyViewContent(view,newScreenId);
		}
	};

	var _replaceIdsForCopyViewImage = function(view,newScreenId){
		var oldViewId = $(view).attr("id");
		var newViewId = V.Utils.getId(newScreenId + "_article");
		$(view).attr("id",newViewId);

		//Hotspots
		var hotspotIdsMapping = {};
		$(view).children("img.hotspot").each(function(index, hotspot) {
			var oldHotspotId = $(hotspot).attr("id");
			var newHotspotId = V.Utils.getId("hotspot-");
			$(hotspot).attr("id",newHotspotId);
			hotspotIdsMapping[oldHotspotId] = newHotspotId;
		});
		// Copy hotspot config
		V.Editor.Screen.copyHotspotConfig(oldViewId,newViewId,hotspotIdsMapping);
	};

	var _replaceIdsForCopyViewContent = function(view,newScreenId){
		var viewId = V.Utils.getId(newScreenId + "_article");
		$(view).attr("id",viewId);

		//Replace zone Ids
		$(view).children("div[id][areaid]").each(function(index, zone) {
			zone = _replaceIdsForCopyZone(zone,newScreenId);
		});
	};

	var _replaceIdsForCopyZone = function(zone,screenId){
		var zoneId = V.Utils.getId(screenId + "_zone");
		$(zone).attr("id",zoneId);

		$(zone).find("[id]").each(function(index, el) {
			el = _replaceIdsForCopyEl(el,zoneId);
		});

		return zone;
	};

	var _replaceIdsForCopyEl = function(el,zoneId){
		var elName = _getNameOfCopyEl(el);
		var elId = V.Utils.getId(zoneId + "_" + elName);
		$(el).attr("id",elId);
		return el;
	};

	var _getNameOfCopyEl = function(el){
		var elName = $($(el).attr("id").split("_")).last()[0];
		if (elName.length>1){
			return elName.substring(0,elName.length-1);
		} else {
			return elName;
		}
	};


	// Add slides
	var addSlide = function(slide){
		var slide = $(slide);
		var slideType = V.Slides.getSlideType(slide);
		
		if(V.Slides.getCurrentScreen()){
			$(V.Slides.getCurrentScreen()).after(slide);
		} else {
			appendSlide(slide);
		}

		var oldCurrentSlideNumber = V.Slides.getCurrentScreenNumber();
		//currentSlide number is next slide
		V.Slides.setCurrentSlideNumber(oldCurrentSlideNumber+1);

		if(slideType===V.Constant.VIEW_CONTENT){
			V.Editor.Tools.addTooltipsToSlide(slide);
		}

		V.Slides.triggerLeaveEvent(oldCurrentSlideNumber);
		V.Slides.updateSlides();
		V.Slides.triggerEnterEvent(V.Slides.getCurrentScreenNumber());

		V.Editor.Thumbnails.redrawThumbnails(function(){
			V.Editor.Thumbnails.selectThumbnail(V.Slides.getCurrentScreenNumber());
			V.Editor.Thumbnails.moveThumbnailsToSlide(V.Slides.getCurrentScreenNumber());
		});
	};

	var appendSlide = function(slide){
		$('.slides').append(slide);
	}

	var removeCurrentSlide = function(){
		_removeSlide(V.Slides.getCurrentSlide());
	};

	var onDeleteScreenClicked = function(event){
		var slideNumber = $(event.target).prev("img").attr("slidenumber");
		var slideToDelete = $("article[type='screen'][slidenumber='" + slideNumber + "']")[0];
		_removeSlide(slideToDelete);
	};

	var onDeleteSubslideClicked = function(event){
		var currentScreen = V.Slides.getCurrentScreen();
		var slideNumber = $(event.target).prev("img").attr("slidenumber");
		var slideToDelete = $(currentScreen).find("article[slidenumber='" + slideNumber + "']")[0];
		_removeSlide(slideToDelete);
	};

	var _removeSlide = function(slideToDelete){
		var removeSubslide = V.Slides.isSubslide(slideToDelete);

		var options = {};
		options.width = 375;
		options.height = 130;
		options.notificationIconSrc = V.Editor.Thumbnails.getThumbnailURL(slideToDelete);
		options.notificationIconClass = "notificationIconDelete";
		if(removeSubslide===true){
			options.text = V.I18n.getTrans("i.areYouSureDeleteView");
		} else {
			options.text = V.I18n.getTrans("i.areYouSureDeleteScreen");
		}

		var button1 = {};
		button1.text = V.I18n.getTrans("i.no");
		button1.callback = function(){
			$.fancybox.close();
		}
		var button2 = {};
		button2.text = V.I18n.getTrans("i.delete");
		button2.callback = function(){
			if(removeSubslide){
				_removeSubslide(slideToDelete);
			} else {
				_removeScreen(slideToDelete);
			}
			$.fancybox.close();
		}
		options.buttons = [button1,button2];
		V.Utils.showDialog(options);
	};

	var _removeScreen = function(slide){
		if(slide===null){
			return;
		}

		if(V.Screen.isScreen(slide)){
			V.Editor.Screen.beforeRemoveSlideset(slide);
		}

		var slideToDeleteNumber = $(slide).attr("slidenumber");
		var currentSlideNumber = V.Slides.getCurrentScreenNumber();

		$(slide).remove();

		if(slideToDeleteNumber <= currentSlideNumber){
			if((currentSlideNumber-1) > 0) {
				V.Slides.setCurrentSlideNumber(currentSlideNumber-1);
			} else if (V.Slides.getSlidesQuantity()>1){
				V.Slides.setCurrentSlideNumber(1);
			}
		}

		V.Slides.updateSlides();
		V.Editor.Thumbnails.redrawThumbnails(function(){
			if(typeof V.Slides.getCurrentScreen() !== "undefined"){
				V.Editor.Thumbnails.selectThumbnail(V.Slides.getCurrentScreenNumber());
				V.Editor.Thumbnails.moveThumbnailsToSlide(V.Slides.getCurrentScreenNumber());
				V.Slides.triggerEnterEventById($(V.Slides.getCurrentScreen()).attr("id"));
			}
		});
	};

	var _removeSubslide = function(subslide){
		if(typeof subslide !== "object"){
			return;
		}

		var screen = $(subslide).parent();
		var currentSubslide = V.Slides.getCurrentView();
		var removingCurrentSubslide = (currentSubslide === subslide);

		V.Editor.Screen.beforeRemoveSubslide(screen,subslide);
		$(subslide).remove();

		//Update subslide counters
		var subslides = $(screen).find("article");
		$(subslides).each(function(index,subslide){
			$(subslide).attr("slidenumber",index+1);
		});	

		V.Editor.Thumbnails.drawSlidesetThumbnails(subslides,function(){
			//Subslides Thumbnails drawed succesfully
			if(removingCurrentSubslide === false){
				V.Editor.Thumbnails.selectSubslideThumbnail($(currentSubslide).attr("slidenumber"));
			}
		});

		//After remove a subslide, load screen if the current subslide was deleted
		if(removingCurrentSubslide){
			V.Editor.Screen.openSlideset(screen);
		}
	};

	//////////////
	// Subslides
	//////////////

	var addSubslide = function(slideset,subslide){ 
		var subslide = $(subslide).css("display","none")[0];
		appendView(slideset,subslide);
		V.Editor.Tools.addTooltipsToSlide(subslide);
		V.Editor.Screen.openSubslide(subslide);
		V.Editor.Thumbnails.drawSlidesetThumbnails($(slideset).find("article"),function(){
			//Subslides Thumbnails drawed succesfully
			V.Editor.Thumbnails.selectSubslideThumbnail($(subslide).attr("slidenumber"));
		});
		V.Editor.Screen.afterCreateSubslide(slideset,subslide);
	};

	var appendView = function(slideset,subslide){
		$(slideset).append(subslide);
	}

	var updateThumbnail = function(slide){
		var slideThumbnail = V.Editor.Thumbnails.getThumbnailForSlide(slide);
		var thumbnailURL = V.Editor.Thumbnails.getThumbnailURL(slide);

		//Capure load img error
		$(slideThumbnail).error(function(response){
			//Load the default image
			_updateThumbnail(slide,slideThumbnail,V.Editor.Thumbnails.getDefaultThumbnailURL(slide));
		});

		_updateThumbnail(slide,slideThumbnail,thumbnailURL);
	};

	var _updateThumbnail = function(slide,slideThumbnail,thumbnailURL){
		if(V.Screen.isScreen(slide)){
			$("#slideset_selected > img").attr("src",thumbnailURL);
		}
		$(slideThumbnail).attr("src",thumbnailURL);
	};

	return {
		updateCurrentSlideFromHash	: updateCurrentSlideFromHash,
		showSlides				: showSlides,
		hideSlides				: hideSlides,
		isSlideFocused			: isSlideFocused,
		moveSlideTo				: moveSlideTo,
		copyScreen				: copyScreen,
		appendSlide				: appendSlide,
		addSlide 				: addSlide,
		removeCurrentSlide		: removeCurrentSlide,
		addSubslide				: addSubslide,
		appendView				: appendView,
		removeCurrentSlide		: removeCurrentSlide,
		onDeleteScreenClicked	: onDeleteScreenClicked,
		onDeleteSubslideClicked	: onDeleteSubslideClicked,
		updateThumbnail			: updateThumbnail,
		copyTextAreasOfSlide	: copyTextAreasOfSlide,
		forwardOneSubslide		: forwardOneSubslide,
		backwardOneSubslide		: backwardOneSubslide,
		moveSubslides			: moveSubslides,
		goToSubslide			: goToSubslide
	}; 

}) (VISH, jQuery);