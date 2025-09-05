VISH.Editor.Utils = (function(V,$,undefined){

	var setStyleInPixels = function(style,area){
		var filterStyle = "";
		$.each(style.split(";"), function(index, property){
			if ((property.indexOf("width") === -1)&&(property.indexOf("height")) === -1) {
				filterStyle = filterStyle + property + "; ";
			}
		});
		
		var dimensions = V.Utils.getPixelDimensionsFromStyle(style,area);

		if((dimensions)&&(dimensions[0])){
			filterStyle = filterStyle + "width: " + dimensions[0] + "px; ";
			if(dimensions[1]){
				filterStyle = filterStyle + "height: " + dimensions[1] + "px; ";
			}
		}
		return filterStyle;
	};
	
	var addZoomToStyle = function(style,zoom){
		if(!style){
			return null;
		}

		var filterStyle = "";
		$.each(style.split(";"), function(index, property){
			if ((property.indexOf("-ms-transform") === -1)&&(property.indexOf("-moz-transform") === -1)
			 &&(property.indexOf("-o-transform") === -1)&&(property.indexOf("-webkit-transform") === -1)
			 &&(property.indexOf("-moz-transform-origin") === -1)&&(property.indexOf("-webkit-transform-origin") === -1)
			 &&(property.indexOf("-o-transform-origin") === -1)&&(property.indexOf("-ms-transform-origin") === -1)) {
				filterStyle = filterStyle + property + "; ";
			}
		});
			
		//  -moz-transform: scale(1.0);
		//  -moz-transform-origin: 0 0;
		//  -o-transform: scale(1.0);
		//  -o-transform-origin: 0 0;
		//  -webkit-transform: scale(1.0);
		//  -webkit-transform-origin: 0 0;
		//  -ms-transform: scale(1.0);
		//  -ms-transform-origin: 0 0;
			
		if(zoom){
			filterStyle = filterStyle + "-ms-transform: scale(" + zoom + "); ";
			filterStyle = filterStyle + "-ms-transform-origin: 0 0; ";
			filterStyle = filterStyle + "-moz-transform: scale(" + zoom + "); ";
			filterStyle = filterStyle + "-moz-transform-origin: 0 0; ";
			filterStyle = filterStyle + "-o-transform: scale(" + zoom + "); ";
			filterStyle = filterStyle + "-o-transform-origin: 0 0; ";
			filterStyle = filterStyle + "-webkit-transform: scale(" + zoom + "); ";
			filterStyle = filterStyle + "-webkit-transform-origin: 0 0; ";
		}

		return filterStyle;
	};
	 
	/**
	 * function to get the styles in percentages
	 */
	var getStylesInPercentages = function(parent, element){
		var WidthPercent = element.width()*100/parent.width();
		var HeightPercent = element.height()*100/parent.height();
		var TopPercent = element.position().top*100/parent.height();
		var LeftPercent = element.position().left*100/parent.width();
		return "position: relative; width:" + WidthPercent + "%; height:" + HeightPercent + "%; top:" + TopPercent + "%; left:" + LeftPercent + "%;" ;
	}; 
	
	/* Generate table for carrousels */
	var generateTable = function(options){
		//Default values
		var title = "Unknown";
		var author = "";
		var description = "";
		var tableClass = "metadata";

		if(options){
			if(options.title){
				title = options.title;
			}

			if(options.author){
				author = options.author;
			}

			if(options.description){
				description = options.description;
			}

			if(options.tableClass){
				tableClass = options.tableClass;
			}

			if(options.url){
				title = "<a title='view resource' class='metadata_link' target='_blank' href='"+options.url+"'>" + title + "</a>";
			}
		}

		return "<table class=\""+tableClass+"\">"+
		 "<tr class=\"even\">" +
		   "<td class=\"title header_left\">" + V.I18n.getTrans("i.Title") + "</td>" + 
		   "<td class=\"title header_right\"><div class=\"height_wrapper\">" + title + "</div></td>" + 
		 "</tr>" + 
		 "<tr class=\"odd\">" + 
		   "<td class=\"title\">" + V.I18n.getTrans("i.Author") + "</td>" + 
		   "<td class=\"info\"><div class=\"height_wrapper\">" + author + "</div></td>" + 
		 "</tr>" + 
		 "<tr class=\"even\">" + 
		   "<td colspan=\"2\" class=\"title_description\">" + V.I18n.getTrans("i.Description") + "</td>" + 
		 "</tr>" + 
		 "<tr class=\"odd\">" + 
		   "<td colspan=\"2\" class=\"info_description\"><div class=\"height_wrapper_description\">" + description + "</div></td>" + 
		 "</tr>" + 
		"</table>";
	};


	var convertToTagsArray = function(tags){
		var tagsArray = [];

		if((!tags)||(tags.length==0)){
			return tagsArray;
		}

		$.each(tags, function(index, tag) {
			tagsArray.push(tag.value)
		});

		return tagsArray;
	};


	//Help function to autocomplete user inputs.
	//Add HTTP if is not present.
	var autocompleteUrls = function(input){
		var http_urls_pattern=/(^http(s)?:\/\/)/g
		var anchor_urls_pattern=/(^#)/g
		var objectInfo = V.Object.getObjectInfo(input);
		if((objectInfo.wrapper==null)&&(input.match(http_urls_pattern)==null)&&(input.match(anchor_urls_pattern)==null)){
			return "http://" + input;
		} else {
			return input;
		}
	};

	var filterFilePath = function(path){
		return path.replace("C:\\fakepath\\","");
	};



	/////////////////////////
	/// Fancy Box Functions
	/////////////////////////

	var loadTabTimer;

	/**
	 * Function to load a tab and its content in the fancybox
	 * also changes the help button to show the correct help
	 */
	var loadTab = function (tab_id){
		//hide previous tab
		$(".fancy_tab_content").hide();
		//show content
		$("#" + tab_id + "_content").show();
		//deselect all of them
		$(".fancy_tab").removeClass("fancy_selected");
		//select the correct one
		$("#" + tab_id).addClass("fancy_selected");
		//show correct one
		$("#"+ tab_id + "_help").show();

		//Submodule callbacks
		switch (tab_id) {
			//Image
			case "tab_pic_from_url":
				V.Editor.Image.onLoadTab("url");
				break;
			//Video
			case "tab_video_from_url":
				V.Editor.Video.onLoadTab();
				break;
			//Objects
			case "tab_object_from_url":
				V.Editor.Object.onLoadTab("url");
				break;
			default:
				break;
		}
		return false;
	};

	var hideNonDefaultTabs = function(){
		$("div.fancy_tabs a.fancy_tab:not(.disabled)").show();
	};

	var showErrorDialog = function(msg){
		var options = {};
		options.width = 650;
		options.height = 190;
		options.text = msg;
		var button1 = {};
		button1.text = V.I18n.getTrans("i.Ok");
		button1.callback = function(){
			$.fancybox.close();
		}
		options.buttons = [button1];
		V.Utils.showDialog(options);
	};

	var enableElementSettingsField = function(element,enable){
		if(element instanceof Array){
			for(var i=0; i<element.length; i++){
				enableElementSettingsField(element[i],enable);
			}
			return;
		}

		if(enable){
			$(element).parent().removeClass("disableSettingsField");
			$(element).removeAttr('disabled');
		} else {
			if ($(element).is("input")){
				if ($(element).attr("type")==="checkbox"){
					var defaultCheckboxValue = ($(element).attr("defaultvalue")==="true") ? true : false;
					$(element).prop('checked', defaultCheckboxValue);
				}
			} else if ($(element).is("select")){
				var defaultSelectValue = $(element).find("option[selected='selected']").val();
				$(element).val(defaultSelectValue);
			}
			$(element).parent().addClass("disableSettingsField");
			$(element).attr('disabled', 'disabled');
		}
	};

	return {
		setStyleInPixels  			: setStyleInPixels,		
		addZoomToStyle  			: addZoomToStyle,	
		getStylesInPercentages 		: getStylesInPercentages,
		generateTable 				: generateTable,
		convertToTagsArray 			: convertToTagsArray,
		autocompleteUrls 			: autocompleteUrls,
		filterFilePath 				: filterFilePath,
		loadTab						: loadTab,
		hideNonDefaultTabs			: hideNonDefaultTabs,
		showErrorDialog				: showErrorDialog,
		enableElementSettingsField	: enableElementSettingsField
	};

}) (VISH, jQuery);

