VISH.Presentation = (function(V,undefined){
	
	/**
	 * Function to initialize and render the scene
	 */
	var init = function(scene,callback){
		V.ViewerAdapter.applyAspectRatio(scene.aspectRatio);
		V.Renderer.init();
		var screens = scene.screens;
		for(var i=0;i<screens.length;i++){
			V.Renderer.renderScreen(screens[i]);
		}

		if(typeof callback == "function"){
			callback();
		}
	};


	return {
		init: init
	};

}) (VISH);
