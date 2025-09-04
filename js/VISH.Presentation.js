VISH.Presentation = (function(V,undefined){
	
	/**
	 * Function to initialize and render the scene
	 */
	var init = function(screens,callback){
		V.Renderer.init();

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
