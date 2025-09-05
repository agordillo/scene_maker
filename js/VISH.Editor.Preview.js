VISH.Editor.Preview = (function(V,$,undefined){

	var presentationPreview = null;

	var init = function(){
		//Wait for loading...
		setTimeout(function(){
			_realInit();
		},2000);
	}

	var _realInit = function(){
		$("#preview_action").fancybox({
			'width'				: 910,
			'height'			: 680,
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
	}

	var preview = function(){
		_prepare();
		$("#preview_action").trigger('click');
	}

	var _prepare = function(){
		var slideNumberToPreview = 1;
		if(typeof V.PreviewPath != "undefined"){
			$("#preview_action").attr("href", V.PreviewPath + "#" + slideNumberToPreview);
		}
		presentationPreview = V.Editor.savePresentation();
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