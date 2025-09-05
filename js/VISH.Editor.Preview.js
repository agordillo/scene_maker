VISH.Editor.Preview = (function(V,$,undefined){

	var presentationPreview = null;

	var init = function(){
	};

	var preview = function(){
		var slideNumberToPreview = 1;
		if(typeof V.PreviewPath !== "undefined"){
			$("#preview_action").attr("href", V.PreviewPath + "#" + slideNumberToPreview);
		}
		presentationPreview = V.Editor.savePresentation();

		_initFancybox();
		$("#preview_action").trigger('click');
	};

	var _initFancybox = function(){
		$("#preview_action").fancybox({
			'width'				: _getFancyboxDimensions().width,
			'height'			: _getFancyboxDimensions().height,
			'padding'			: 0,
			'autoScale'     	: false,
			'transitionIn'		: 'none',
			'transitionOut'		: 'none',
			'type'				: 'iframe',
			'onStart'			: function(){
				if(presentationPreview === null){
					_prepare();
				}
				V.Editor.Utils.Loader.unloadObjectsInEditorSlide(V.Slides.getCurrentScreen());
			},
			'onClosed'			: function() {
				presentationPreview = null;
				V.Editor.Utils.Loader.loadObjectsInEditorSlide(V.Slides.getCurrentScreen());
			},
			'onComplete': function() {
			}
		});
	};

	var _getFancyboxDimensions = function(){
		var dimensions = {};
		if($("body").attr("aspectRatio")==="16:9"){
			dimensions.width = 1000;
			dimensions.height = 670;
		} else {
			dimensions.width = 910;
			dimensions.height = 680;
		}
		return dimensions;
	};

	var getPreview = function(){
		return presentationPreview;
	};

	return {
		init 			: init,
		preview 		: preview,
		getPreview 		: getPreview
	};

}) (VISH, jQuery);