SceneMaker.Video.HTML5 = (function(SM,$,undefined){
	var init = function(){
	};

	var setMultimediaEvents = function(){
		var multimediaEls = $("video, audio");
		$.each(multimediaEls, function(index, mEl){
			var isVideo = (mEl.tagName==="VIDEO");
			/* Events
			mEl.addEventListener('play', function(){
				// SM.Debugging.log("Play at " + mEl.currentTime);
			}, false);
			mEl.addEventListener('pause', function(){
				// SM.Debugging.log("Pause " + mEl.currentTime);
			}, false);
			mEl.addEventListener('ended', function(){
				// SM.Debugging.log("Ended " + mEl.currentTime);
			}, false);
			mEl.addEventListener("error", function(err){
                // SM.Debugging.log("mEl error: " + err);
            }, false);
			mEl.addEventListener("seeked", function(err){
                // SM.Debugging.log("Seek at " + mEl.currentTime);
            }, false);
            */
            if(isVideo){
				//PREVENT KEYBOARD EVENTS ON FIREFOX
				$(mEl).focus(function(event){
					this.blur();
				});
            }
		});
	};
	
	/**
	 * Function to play all videos and audios of a slide
	 */
	var playMultimedia = function($slide){
		var multimediaEls = $slide.find("video, audio");
		$.each(multimediaEls, function(index,mEl){
			$mEL = $(mEl);
			if(($mEL.attr("resumeonslideenter")==="true")&&(typeof $mEL.attr("wasplayingonslideleave") !== "undefined")){
				if ($mEL.attr("wasplayingonslideleave")=="true"){
					mEl.play();
				} else if ($(mEl).attr("wasplayingonslideleave")=="false"){
					//Do nothing
				}
			} else {
				if (mEl.currentTime > 0) {
					mEl.currentTime = 0;
					if((typeof $mEL.attr("poster") === "string")&&($mEL.attr("autoplayonslideenter")!=="true")){
						mEl.load();
					}
				}
				if ($mEL.attr("autoplayonslideenter")==="true"){
					mEl.play();
				}
			}
		});
	};
	
	/**
	 * Function to stop all videos and audios of a slide
	 */
	var stopMultimedia = function($slide){
		var multimediaEls = $slide.find("video, audio");
		$.each(multimediaEls, function(index,mEl){
			var playing = !mEl.paused;
			$(mEl).attr("wasplayingonslideleave",playing);
			if(playing){
				mEl.pause();
			}
		});
	};

	 var renderVideoFromJSON = function(videoJSON, options){
		if (typeof videoJSON === "undefined") {
			return "";
		}

		var renderOptions = $.extend({}, options);

		if (typeof renderOptions.id === "undefined") {
			renderOptions.id = videoJSON['id'] ? videoJSON['id'] : SM.Utils.getId();
		}

		renderOptions.style = videoJSON['style'];

		var videoSettings = {};
		if (typeof videoJSON.settings === "object") {
			videoSettings = videoJSON.settings;
		}

		renderOptions.autoplay = (typeof videoSettings['autoplay'] !== "undefined") ? videoSettings['autoplay'] : false;
		renderOptions.loop = (typeof videoSettings['loop'] !== "undefined") ? videoSettings['loop'] : false;
		renderOptions.controls = (typeof videoSettings['controls'] !== "undefined") ? videoSettings['controls'] : true;
		renderOptions.resume = (typeof videoSettings['resume'] !== "undefined") ? videoSettings['resume'] : false;
		renderOptions.poster = (typeof videoSettings['poster'] === "string") ? videoSettings['poster'] : undefined;

		return renderVideoFromSources(getSourcesFromJSON(videoJSON), renderOptions);
	};

	var renderVideoFromSources = function(sources,options){
		var $video = $("<video></video>");

		$video.attr("preload","metadata");

		if((options)&&(options.extraAttrs)){
			for(var key in options.extraAttrs){
				$video.attr(key,options.extraAttrs[key]);
			}
		}

		if(options){
			if(options['id']){
				$video.attr("id",options['id']);
			}
			if(options['extraClasses']){
				var extraClassesLength = options['extraClasses'].length;
				for(var i=0; i<extraClassesLength; i++){
					$video.addClass(options['extraClasses'][i]);
				}
			}

			if(options.autoplay === true){
				$video.attr("autoplayonslideenter", "true");
			}
			$video.prop("loop", options.loop === true);
			$video.prop("controls", options.controls !== false);
			if(options.resume === true){
				$video.attr("resumeonslideenter", "true");
			}
			if(typeof options.poster === "string"){
				$video.attr("poster",options.poster);
			}

			if (options.style){
				$video.attr("style",options['style']);
			}
		}

		//Default callback
		if (!$video.attr("onloadeddata")) {
			$video.attr("onloadeddata",'SceneMaker.Video.HTML5.onVideoReady(this)');
		}

		var video = (SM.Utils.getOuterHTML($video)).split("</video>")[0];

		//Write sources (we can't loaded it to the DOM directly, because then they will start to load, before been actually rendered)
		if((!options)||(options.loadSources !== false)){
			$.each(sources, function(index, source){
				if(typeof source.src == "string"){
					var sourceSrc = source.src;
					if(options && options.timestamp === true){
						sourceSrc = SM.Utils.addParamToUrl(sourceSrc,"timestamp",""+new Date().getTime());
					}
					var mimeType = (source.mimeType)?"type='" + source.mimeType + "' ":"";
					video = video + "<source src='" + sourceSrc + "' " + mimeType + ">";
				}
			});
			if(sources.length>0){
				video = video + "<p>Your browser does not support HTML5 video.</p>";
			}
		}

		video = video + "</video>";

		return video;
	};

	var addSourcesToVideoTag = function(sources,videoTag,options){
		var options = options || {};

		$.each(sources, function(index, source){
			if(typeof source.src == "string"){
				var sourceSrc = source.src;
				if(options.timestamp === true){
					sourceSrc = SM.Utils.addParamToUrl(sourceSrc,"timestamp",""+new Date().getTime());
				}
				var mimeType = (source.mimeType)?"type='" + source.mimeType + "' ":"";
				$(videoTag).append("<source src='"+sourceSrc+"' " + mimeType + ">");
			}
		});
		if(sources.length>0){
			$(videoTag).append("<p>Your browser does not support HTML5 video.</p>");
		}
	};

	var onVideoReady = function(video){
		//Check state (based on http://www.w3schools.com/tags/av_prop_readystate.asp)
		if((typeof video != "undefined")&&((video.readyState == 4)||(video.readyState == 3))){
			$(video).attr("loaded","true");
		}
	};


	/*
	 * Utils
	 */

	var getSources = function(videoDOM){
		if(typeof videoDOM == "string"){
			var sources = [];
			//Prevent video to be rendered in a non appropriate time.
			var srcPattern = new RegExp("src=(\'||\")([a-z-.://0-9]+)","g");

			var found;
			while(found = srcPattern.exec(videoDOM)){
				if(found.length>2){
					sources.push(found[2]);
				}
				srcPattern.lastIndex = found.index+1;
			};

			return sources.map(function(value){ return {"src": value, "mimeType": _getVideoMimeType(value)}});
		}

		try {
			return $(videoDOM).find("source").map(function(){ return {"src": this.src, "mimeType": _getVideoMimeType(this.src)}});
		} catch(e){
			return [];
		}
		
		return [];
	};

	var _getVideoMimeType = function(url){
		var source = (SM.Object.getObjectInfo(url)).source;
		return "video/" + source.split('.').pop().split("?")[0];
	};

	var getSourcesFromJSON = function(videoJSON){
		if(typeof videoJSON != "object"){
			return [];
		}

		if(typeof videoJSON.sources === "string"){
			try {
				var sources = JSON.parse(videoJSON.sources);
			} catch (e){
				return [];
			}
		} else if(typeof videoJSON.sources === "object"){
			var sources = videoJSON.sources;
		}

		return sources;
	};

	var getPoster = function(videoDOM){
		if(typeof videoDOM == "string"){
			//Prevent video to be rendered in a non appropriate time.
			var posterPattern = new RegExp("poster=(\'||\")([a-z.://0-9?=%]+)","g");
			var found = posterPattern.exec(videoDOM);
			if((typeof found != "undefined")&&(found != null)&&(found.length>2)){
				return found[2];
			}
			return undefined;
		}
		return $(videoDOM).attr("poster");
	};

	return {
		init 					: init,
		setMultimediaEvents 	: setMultimediaEvents,
		playMultimedia			: playMultimedia,
		stopMultimedia			: stopMultimedia,
		renderVideoFromJSON		: renderVideoFromJSON,
		renderVideoFromSources	: renderVideoFromSources,
		addSourcesToVideoTag	: addSourcesToVideoTag,
		getSources 				: getSources,
		getSourcesFromJSON		: getSourcesFromJSON,
		getPoster				: getPoster,
		onVideoReady 			: onVideoReady
	};

})(SceneMaker,jQuery);