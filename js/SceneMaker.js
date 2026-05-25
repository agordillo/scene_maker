var SceneMaker = SceneMaker || {};

SceneMaker.VERSION = '1.1.0';

SceneMaker.getOptions = function(){
	try {
		if(window.parent.SCENE_MAKER_OPTIONS_PREVIEW){
			return window.parent.SCENE_MAKER_OPTIONS_PREVIEW;
		}
		if(window.SCENE_MAKER_OPTIONS){
			return window.SCENE_MAKER_OPTIONS;
		}
		if(window.parent.SCENE_MAKER_OPTIONS){
			return window.parent.SCENE_MAKER_OPTIONS;
		}
	} catch (e){}
	return;
};