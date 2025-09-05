VISH.Editor.ViewerAdapter = (function(V,$,undefined){

	//Internals
	var _initialized = false;

	var init = function(options){
		if(_initialized){
			return;
		} 
		_initialized = true;
	};

	var applyAspectRatio = function(newAspectRatio){
		if((typeof newAspectRatio !== "string")||(["4:3","16:9"].indexOf(newAspectRatio)===-1)){
			return;
		}
		var previousAspectRatio = $("body").attr("aspectRatio");
		if(previousAspectRatio === newAspectRatio){
			return;
		}

		console.log("Apply applyAspectRatio", newAspectRatio);

		$("body").attr("aspectRatio", newAspectRatio);
	};

	return {
		init 			 : init,
		applyAspectRatio : applyAspectRatio
	};

}) (VISH, jQuery);