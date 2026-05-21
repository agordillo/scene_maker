SceneMaker.Object = (function(SM,$,undefined){
			
	var init = function(){
		SM.Object.PDF.init();
	};

	/*
	 * Wrapper can be: "embed","object, "iframe", "video" or null if the object is a source url without wrapper.
	 * Type is the source type.
	 */
	function objectInfo(wrapper,source,sourceType){
		this.wrapper=wrapper;
		this.source = source;
		this.type=sourceType;
	};
	
	var getObjectInfo = function(object){
		var wrapper = null;
		
		//Determine wrapper
		if(typeof object === "string"){
			var videoPattern = new RegExp("^<video","g");
			if(videoPattern.exec(object) !== null){
				wrapper = "VIDEO";
			}

			var audioPattern = new RegExp("^<audio","g");
			if(audioPattern.exec(object) !== null){
				wrapper = "AUDIO";
			}
		}

		if((wrapper===null)||(typeof wrapper === "undefined")){
			var element = $(object)[0];
			if(typeof element !== 'undefined'){
				wrapper = element.tagName;
			}
		}
		
		//Determine source type
		var source = _getSourceFromObject(object,wrapper);
		
		var type;
		switch (wrapper){
			case "VIDEO":
				type = SM.Constant.MEDIA.HTML5_VIDEO;
				break;
			case "AUDIO":
				type = SM.Constant.MEDIA.HTML5_AUDIO;
				break;
			case "IFRAME":
			default:
				type = _getTypeFromSource(source);
		};

		return new objectInfo(wrapper,source,type);
	};
	
	var _getSourceFromObject = function(object,wrapper){
		var source = null;

		switch (wrapper){
			case null:
				source = object;
				break;
			case SM.Constant.WRAPPER.IMAGE:
			case SM.Constant.WRAPPER.EMBED:
			case SM.Constant.WRAPPER.IFRAME:
				source = $(object).attr("src");
				break;
			case SM.Constant.WRAPPER.OBJECT:
				if (typeof $(object).attr("src") != 'undefined'){
					source = $(object).attr("src");
				} else if (typeof $(object).attr("data") != 'undefined'){
					source = $(object).attr("data");
				}
				break;
			case SM.Constant.WRAPPER.VIDEO:
				return SM.Video.HTML5.getSources(object);
			case SM.Constant.WRAPPER.AUDIO:
				return SM.Audio.HTML5.getSources(object);
			default:
				SM.Debugging.log("Unrecognized object wrapper: " + wrapper);
				break;
		}

		if((wrapper==null)||(wrapper==SM.Constant.WRAPPER.IFRAME)){
			var googledoc_pattern=/(^https?:\/\/docs.google.com\/viewer\?url=)/g
			var googleDocMatch = source.match(googledoc_pattern);
			if((googleDocMatch instanceof Array)&&(googleDocMatch.length === 1)){
				source = source.replace(googleDocMatch[0],"").replace("&embedded=true","");
			}
		}
		
		return source;
	};

	//Patterns
	var http_urls_pattern=/(http(s)?:\/\/)([aA-zZ0-9%=_&+?])+([./-][aA-zZ0-9%=_&+?]+)*[/]?/g
	var www_urls_pattern = /(www[.])([aA-zZ0-9%=_&+?])+([./-][aA-zZ0-9%=_&+?]+)*[/]?/g
	var youtube_video_pattern=/(http(s)?:\/\/)?(((youtu.be\/)([aA-zZ0-9-]+))|((www.youtube.com\/((watch\?v=)|(embed\/)|(v\/)))([aA-z0-9-Z&=.])+))/g
	var reusable_puzzle_instance_pattern = /^https?:\/\/[^\/]+\/escapeRooms\/[A-Za-z0-9]+\/reusablePuzzleInstances\/[A-Za-z0-9]+\/render(\?.*)?$/

	var html5VideoFormats = ["mp4","webm","ogg"];
	var imageFormats = ["jpg","jpeg","png","gif","bmp","svg"];
	var audioFormats = ["mp3", "wav","ogg"];

	var _getTypeFromSource = function(source){
		if((typeof source === "object")&&(source !== null)&&(typeof source.length === "number")&&(source.length > 0)){
			source = source[0];
		}
		if(typeof source !== "string"){
			return null;
		}

		if(source.match(reusable_puzzle_instance_pattern)!==null){
			return SM.Constant.MEDIA.REUSABLE_PUZZLE_INSTANCE;
		}

		if(source.match(youtube_video_pattern)!==null){
			return SM.Constant.MEDIA.YOUTUBE_VIDEO;
		}

		//Purge options
		source = source.split('?')[0];

		var extension = getExtensionFromSrc(source);

		if(imageFormats.indexOf(extension)!==-1){
			return SM.Constant.MEDIA.IMAGE;
		}

		if(extension==="pdf"){
			return SM.Constant.MEDIA.PDF;
		}

		if(html5VideoFormats.indexOf(extension)!==-1){
			return SM.Constant.MEDIA.HTML5_VIDEO;
		}

		if(audioFormats.indexOf(extension)!==-1){
			return SM.Constant.MEDIA.HTML5_AUDIO;
		}

		if(extension==="json"){
			return SM.Constant.MEDIA.JSON;
		}

		if((extension==="doc")||(extension==="docx")){
			return SM.Constant.MEDIA.DOC;
		}

		if((extension==="ppt")||(extension==="pptx")||(extension==="odp")){
			return SM.Constant.MEDIA.PPT;
		}

		if((source.match(http_urls_pattern)!==null)||(source.match(www_urls_pattern)!==null)){
			return SM.Constant.MEDIA.WEB;
		}

		return extension;
	};
	
	var getExtensionFromSrc = function(source){
		return (source.split('.').pop().split('&')[0]).toLowerCase();
	};

	return {
		init							: init,
		getExtensionFromSrc 			: getExtensionFromSrc,
		getObjectInfo					: getObjectInfo
	};

}) (SceneMaker, jQuery);