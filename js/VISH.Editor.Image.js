VISH.Editor.Image = (function(V,$,undefined){
	
	var contentToAdd = null;
	var contentAddMode = V.Constant.NONE;

	var urlDivId = "tab_pic_from_url_content";
	var urlInputId = "picture_url";
	
	var init = function(){
		//Load from URL
		$("#" + urlDivId + " .previewButton").click(function(event){
			if(V.Police.validateObject($("#" + urlInputId).val())[0]){
				contentToAdd = V.Editor.Utils.autocompleteUrls($("#" + urlInputId).val());
				V.Editor.Object.drawPreview(urlDivId, contentToAdd, {"contentAddMode": contentAddMode});
			}
		});	
	};
	
	var onLoadTab = function(tab){
		if(tab=="url"){
			_onLoadURLTab();
		}
	};
	
	var _onLoadURLTab = function(){
		if(contentAddMode === V.Constant.SCREEN){
			var $slide = $(V.Slides.getCurrentSlide());
			var avatar = $slide.attr("avatar");
			if(typeof avatar === "string"){
				var imgURL = V.Utils.getSrcFromCSS(avatar);
				if((typeof imgURL === "string")&&(imgURL.length > 0)){
					$("#" + urlInputId).val(imgURL);
					$("#" + urlDivId + " .previewButton").trigger("click");
					return;
				}
			}
		}

		contentToAdd = null;
		V.Editor.Object.resetPreview(urlDivId);
		$("#" + urlInputId).val("");
	};
	
	var addContent = function(content,options){
		if(content){
			contentToAdd = content;
		}

		switch(contentAddMode){
			case V.Constant.SCREEN:
				V.Editor.Screen.onBackgroundSelected(contentToAdd);
				break;
			default:
				V.Editor.Object.drawPreviewObject(contentToAdd, {forceType: V.Constant.MEDIA.IMAGE});
		}
		//Reset contentAddMode
		contentAddMode = V.Constant.NONE;
	};
	
   /**
	* Function to draw an image in a zone of the template
	* the zone to draw is the one in current_area
	* this function also makes the image draggable
	* param area: optional param indicating the area to add the image, used for editing presentations
	* param style: optional param with the style, used in editing presentation
	*/
	var drawImage = function(image_url, area, style, hyperlink, options){
		var current_area;
		var renderOnInit = false;

		if(area){
			current_area = area;
			renderOnInit = true;
		}	else {
			current_area = V.Editor.getCurrentArea();
		}

		if((typeof current_area === "undefined")||(current_area === null)){
			return;
		}

		var newStyle;
		if(style){
			newStyle = V.Editor.Utils.setStyleInPixels(style,current_area);
		} else {
			var image_width = $(current_area).width(); //default image width
			newStyle = "width:"+image_width+"px;";
		}

		var template = V.Editor.getTemplate(current_area);
		var nextImageId = V.Utils.getId();
		var idToDragAndResize = "draggable" + nextImageId;
		current_area.attr('type','image');
		if(hyperlink){
			current_area.attr('hyperlink',hyperlink);
		}
		if(typeof options != "undefined"){
			if (typeof options["vishubPdfexId"] != "undefined"){
				current_area.attr('vishubpdfexid',options["vishubPdfexId"]);
			}
		};
		current_area.html("<img class='"+template+"_image' id='"+idToDragAndResize+"' draggable='true' title='Click to drag' src='"+image_url+"' style='"+newStyle+"'/>");

		if(!style){
			//Adjust dimensions after drawing (Only after insert new images)
			var theImg = $("#"+idToDragAndResize);
			$(theImg).load(function(){
				V.Utils.addTempShown([$(current_area).parent(),$(current_area),$(theImg)]);
				var dimentionsToDraw = V.Utils.dimentionsToDraw($(current_area).width(), $(current_area).height(), $(theImg).width(), $(theImg).height());
				V.Utils.removeTempShown([$(current_area).parent(),$(current_area),$(theImg)]);

				$(theImg).width(dimentionsToDraw.width);
				//Prevent incorrect height detections
				if(dimentionsToDraw.height>0){
					$(theImg).height(dimentionsToDraw.height);
				}
			});
		};

		V.Editor.addDeleteButton(current_area);
		
		$("#" + idToDragAndResize).draggable({
			cursor: "move",
			stop: function(){
				$(this).parent().click();  //call parent click to select it in case it was unselected	
			}
		});

		if(renderOnInit === false){
			V.Editor.Slides.updateThumbnail(V.Slides.getCurrentSlide());
		};
	};

	var getAddContentMode = function(){
		return contentAddMode;
	};

	var setAddContentMode = function(mode){
		V.Editor.Utils.hideNonDefaultTabs();
		contentAddMode = mode;
	};

	return {
		init 				: init,
		onLoadTab 			: onLoadTab,
		drawImage 			: drawImage,
		addContent 			: addContent,
		getAddContentMode	: getAddContentMode,
		setAddContentMode	: setAddContentMode
	};

}) (VISH, jQuery);
