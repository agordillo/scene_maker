VISH.Editor.Settings = (function(V,$,undefined){

	var init = function(){
	};

	var displaySettings = function(){
		// fancybox to edit presentation settings
		$("a#edit_presentation_details").fancybox({
			'autoDimensions' : false,
			'autoScale' : true,
			'scrolling': 'no',
			'width': 1000,
			'height': 700,
			'padding': 0,
			'hideOnOverlayClick': false,
			'hideOnContentClick': false,
			'showCloseButton': true,
			"onComplete"  : function(data){
				$("#fancybox-wrap").css("margin-top", "20px");
				_onDisplaySettings();
			}
		});

		$("a#edit_presentation_details").trigger('click');
	};

	var _onDisplaySettings = function(){
		_checkIfEnableContinueButton();
	};

	var loadPresentationSettings = function(presentation){
		//Prevent to check presentation var in all cases
		if(!presentation){
			presentation = {};
		}

		//Title
		if(presentation.title){
			$("#presentation_details_input_title").val(presentation.title);
		}

		//Aspect ratio
		var aspectRatio = presentation.aspectRatio;
		if((typeof aspectRatio !== "string")||(["4:3","16:9"].indexOf(aspectRatio)===-1)){
			aspectRatio = "4:3";
		}
		$('#presentation_details_select_aspectRatio').val(aspectRatio);

		V.Editor.ViewerAdapter.applyAspectRatio(aspectRatio);
	};
	
	var _checkIfEnableContinueButton = function(){
		var enable = checkMandatoryFields();
		if(enable){
			$("#save_presentation_details").removeClass("buttonDisabledOnSettings");
			$("#save_presentation_details").removeAttr("disabled");
			$("#save_presentation_details").removeAttr("title");
		} else {
			$("#save_presentation_details").addClass("buttonDisabledOnSettings");
			$("#save_presentation_details").attr("disabled","true");
		}
	};

	var checkMandatoryFields = function(){
		//Check that mandatory params are filled appropiately.
		// var title = $('#presentation_details_input_title').val();
		// if((typeof title != "string")||(title.trim()=="")){
		// 	return false;
		// }
		return true;
	};

	var onSavePresentationDetailsButtonClicked = function(event){
		event.preventDefault();

		//Check if is disabled
		if($(event.target).hasClass("buttonDisabledOnSettings")){
			return;
		}

		$.fancybox.close();

		var settings = saveSettings();
		V.Editor.ViewerAdapter.applyAspectRatio(settings.aspectRatio);
	};

	var saveSettings = function(){
		var settings = {};
		settings.SMVersion = V.VERSION;

		var title = $('#presentation_details_input_title').val();
		if((typeof title == "string")&&(title.trim()!="")){
			settings.title = title;
		}

		var aspectRatio = $('#presentation_details_select_aspectRatio').val();
		if((typeof aspectRatio === "string")&&(["4:3","16:9"].indexOf(aspectRatio)!==-1)){
			settings.aspectRatio = aspectRatio;
		} else {
			settings.aspectRatio = "4:3";
		}

		return settings;
	};

	return {
		init									: init,
		displaySettings							: displaySettings,
		loadPresentationSettings				: loadPresentationSettings,
		onSavePresentationDetailsButtonClicked	: onSavePresentationDetailsButtonClicked,
		saveSettings							: saveSettings
	};

}) (VISH, jQuery);