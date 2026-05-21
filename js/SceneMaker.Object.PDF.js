SceneMaker.Object.PDF = (function(SM,$,undefined){
	// var _pdfSupport = false;

	var init = function(){
		// _pdfSupport = SM.Status.getFeatures().pdfReader;
	};

	var generateWrapper = function(url){
		url = SM.Utils.checkUrlProtocol(url);
		// if(_pdfSupport){
		return "<iframe src='" + url + "'></iframe>";
		// }
	};

	var renderPDFFromJSON = function(pdfJSON,options){
		if ((typeof options != "object") || (typeof options.source != "string")){
			return "";
		}

		var style = (pdfJSON['style'])? pdfJSON['style'] : "";
		var pdfBody = generateWrapper(options.source);
		
		var classes = "objectelement";
		if(options.extraClasses){
			classes = classes + " " + options.extraClasses;
		}
		
		return "<div id='"+pdfJSON['id']+"' class='"+ classes +"' objectStyle='" + style + "' objectWrapper=\"" + pdfBody + "\"></div>";
	};

	return {
		init 				: init,
		generateWrapper		: generateWrapper,
		renderPDFFromJSON	: renderPDFFromJSON
	};

})(SceneMaker,jQuery);