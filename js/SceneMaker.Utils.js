SceneMaker.Utils = (function(SM,undefined){
	var initialized = false;
	var ids; // a list of all used ids
	var domIds;	// myDomId = domIds['prefix'] returns a unicId for the specified prefix

	var init = function(){
		if(initialized) return;
		initialized = true;

		ids = [];
		domIds = new Array();
		
		//Extend JQuery functionality
		jQuery.fn.cssNumber = function(prop){
			var v = parseInt(this.css(prop),10);
			return isNaN(v) ? 0 : v;
		};

		jQuery.fn.reverse = [].reverse;

		//Extend primitives
		String.prototype.replaceAll = function(find,replace){
			var str = this;
			return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
		};

		if (!Array.prototype.filter){
			Array.prototype.filter = function(fun /*, thisArg */){
				"use strict";

				if (this === void 0 || this === null)
					throw new TypeError();

				var t = Object(this);
				var len = t.length >>> 0;
				if (typeof fun !== "function")
					throw new TypeError();

				var res = [];
				var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
				for (var i = 0; i < len; i++){
					if (i in t){
						var val = t[i];

						// NOTE: Technically this should Object.defineProperty at
						//       the next index, as push can be affected by
						//       properties on Object.prototype and Array.prototype.
						//       But that method's new, and collisions should be
						//       rare, so use the more-compatible alternative.
						if (fun.call(thisArg, val, i, t))
							res.push(val);
					}
				}

				return res;
			};
		};

		//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
		if(!Array.prototype.map){
			Array.prototype.map = function(fun /*, thisArg */){
				"use strict";

				if (this === void 0 || this === null)
					throw new TypeError();

				var t = Object(this);
				var len = t.length >>> 0;
				if (typeof fun !== "function")
					throw new TypeError();

				var res = new Array(len);
				var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
				for (var i = 0; i < len; i++)
				{
					if (i in t)
						res[i] = fun.call(thisArg, t[i], i, t);
				}
				return res;
			};
		};

		//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf#Compatibility
		if (!Array.prototype.indexOf){
			Array.prototype.indexOf = function(elt /*, from*/){
				var len = this.length >>> 0;
				var from = Number(arguments[1]) || 0;
				from = (from < 0)
					? Math.ceil(from)
					: Math.floor(from);
				if (from < 0)
					from += len;

				for (; from < len; from++){
					if (from in this &&	this[from] === elt)
						return from;
				}
				return -1;
			};
		};

		// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
		if (!Object.keys) {
			Object.keys = (function () {
				'use strict';
				var hasOwnProperty = Object.prototype.hasOwnProperty,
					hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
					dontEnums = [
					'toString',
					'toLocaleString',
					'valueOf',
					'hasOwnProperty',
					'isPrototypeOf',
					'propertyIsEnumerable',
					'constructor'
					],
					dontEnumsLength = dontEnums.length;

				return function (obj) {
					if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
						throw new TypeError('Object.keys called on non-object');
					}

					var result = [], prop, i;

					for (prop in obj) {
						if (hasOwnProperty.call(obj, prop)) {
							result.push(prop);
						}
					}

					if (hasDontEnumBug) {
						for (i = 0; i < dontEnumsLength; i++) {
							if (hasOwnProperty.call(obj, dontEnums[i])) {
								result.push(dontEnums[i]);
							}
						}
					}
					return result;
				};
			}());
		};

		//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
		if (typeof Array.prototype.forEach !== 'function') {
			Array.prototype.forEach = function(callback){
				for (var i = 0; i < this.length; i++){
					callback.apply(this, [this[i], i, this]);
				}
			};
		};

		//Polifill for trim function
		if(typeof String.prototype.trim !== 'function') {
			String.prototype.trim = function() {
				return this.replace(/^\s+|\s+$/g, ''); 
			}
		};

		SM.Utils.Loader.init();
	};

	var getOptions = function(){
		if(SM.Editing){
			return SM.Editor.getOptions();
		} else {
			return SM.Viewer.getOptions();
		}
	};

   /**
	* Return a unic id.
	* full_id_prefix: Specify a prefix for the id, for example, article to get "article_x" ids.
	* Specify a separator for nested ids.
	* justCheck: only check if the id is really unic, if not generate a new id.
	*/
	var getId = function(full_id_prefix){
		if (typeof full_id_prefix !== "string") {
			full_id_prefix = "unicID";
		}
		let full_id;
		if (typeof domIds[full_id_prefix] === "undefined") {
			domIds[full_id_prefix] = 0;
		}
		do {
			domIds[full_id_prefix]++;
			full_id = full_id_prefix + domIds[full_id_prefix];
		} while (
			$("#" + full_id).length !== 0 || ids.includes(full_id)
		);
		ids.push(full_id);
		return full_id;
	};

	var isAvailableId = function(id){
		return ((typeof id === "string")&&(id.trim() !== "")&&(ids.indexOf(id)===-1)&&($("#" + id).length === 0));
	};

	var registerId = function(id){
		if (ids.indexOf(id)===-1){
			ids.push(id);
		}
	};

	var resetIds = function(){
		ids = [];
		domIds = new Array();
	};

	var deepMerge = function(h1,h2){
		let _h1;
		let _h2;
		if(typeof h1 === "object"){
			_h1 = JSON.parse(JSON.stringify(h1));
		} else {
			_h1 = h1;
		}
		if(typeof h2 === "object"){
			_h2 = JSON.parse(JSON.stringify(h2));
		} else {
			_h2 = h2;
		}
		return _deepMerge(_h1,_h2);
	};

	var _deepMerge = function(h1,h2){
		if((typeof h1 === "object")&&(typeof h2 === "object")&&(!(h1 instanceof Array))){
			let keys = Object.keys(Object.assign({},h1,h2));
			let keysL = keys.length;
			for(let i=0; i<keysL; i++){
				h1[keys[i]] = deepMerge(h1[keys[i]],h2[keys[i]]);
			}
			return h1;
		} else {
			if(typeof h2 !== "undefined"){
				return h2;
			} else {
				return h1;
			}
		}
	};

	/**
	 * Fix JSONs with old format and include enhancements
	 * Return null if JSON cannot be loaded
	 */
	var fixScene = function(scene){
		if(typeof scene !== "object"){
			return null;
		}
		if (!Array.isArray(scene.screens)) {
			return null;
		}
		if (scene.screens.length < 1) {
			return null;
		}
		if (typeof scene.SMVersion !== "string") {
			return null;
		}
		//_checkSceneIds(scene);

		return scene;
	};

	var _checkSceneIds = function(scene){
		var repeatedIds = _findRepeatedIds(scene);
		if(repeatedIds.length > 0){
			console.warn("Repeated ids:",repeatedIds);
		}
	};

	function _findRepeatedIds(obj) {
		const seen = {};
		const repeated = [];

		function checkValue(valueToCheck, type, path) {
			if (typeof valueToCheck !== "string" ||	valueToCheck.trim() === "") {
				return;
			}
			if (seen[valueToCheck]) {
				repeated.push({
					type,
					value: valueToCheck,
					first: seen[valueToCheck],
					repeated: path
				});
			} else {
				seen[valueToCheck] = path;
			}
		}

		function walk(value, path) {
			if (!value || typeof value !== "object") {
				return;
			}
			checkValue(value.id, "id", path);
			checkValue(value.idAlias, "idAlias", path);
			if (Array.isArray(value)) {
				value.forEach((item, index) => {
					walk(item, `${path}[${index}]`);
				});
			} else {
				Object.keys(value).forEach(key => {
					walk(value[key], `${path}.${key}`);
				});
			}
		}
		walk(obj, "scene");
		return repeated;
	};

	var getOuterHTML = function(tag){
		//In some old browsers outerHTML does not work
		if (typeof($(tag)[0].outerHTML)==='undefined'){
			return $(tag).clone().wrap('<div></div>').parent().html();
		} else {
			return $(tag)[0].outerHTML;
		}
	};

	var removeParamFromUrl = function(url,paramName){
		if((typeof url !== "string")||(typeof paramName !== "string")){
			return url;
		}

		//Remove hash
		var splitHash = url.split("#");
		url = splitHash[0];

		var splitParams = url.split("?");
		if (splitParams.length === 2){
			url = splitParams[0];
			var params = splitParams[1];

			var validParams = [];
			var splitParams = params.split("&");
			var sPL = splitParams.length;
			for(var i=0; i<sPL; i++){
				var splitParam = splitParams[i].split("=");
				if(splitParam[0]!=paramName){
					validParams.push({key: splitParam[0], value: splitParam[1]}); 
				}
			}
			//Add valid params
			var vPL = validParams.length;
			for(var j=0; j<vPL; j++){
				var param = validParams[j];
				if(j===0){
					url = url + "?";
				} else {
					url = url + "&";
				}
				url = url + param.key + "=" + param.value;
			}
		}

		//Add hash (if present)
		if(splitHash.length>1){
			url = url + "#" + splitHash[1];
		}

		return url;
	};

	var addParamToUrl = function(url,paramName,paramValue){
		if((typeof url !== "string")||(typeof paramName !== "string")||(typeof paramValue !== "string")){
			return url;
		}

		//Remove param (to overwrite it in case if exists)
		url = removeParamFromUrl(url,paramName);

		//Remove hash
		var splitHash = url.split("#");
		url = splitHash[0];

		var param = paramName+"="+paramValue;
		if (url.indexOf('?') > -1){
			url += '&'+param ;
		}else{
			url += '?'+param ;
		}

		//Add hash (if present)
		if(splitHash.length>1){
			url = url + "#" + splitHash[1];
		}
		
		return url;
	};

	var getParamsFromUrl = function(url){
		var params = {};
		if(typeof url !== "string"){
			return params;
		}
		var split = url.split("?");
		if(split.length<=1){
			return params;
		} else {
			//Remove hash if present
			var urlParams = split[1].split("#")[0].split("&");
			for(var i=0; i<urlParams.length; i++){
				var resultSplit = urlParams[i].split("=");
				if(resultSplit.length===2){
					//key-value pairs
					params[resultSplit[0]] = resultSplit[1];
				}
			}
			return params;
		}
	};

	var getScreenNumberFromHash = function(){
		try {
			var location = window.location;
			if(typeof location == "undefined"){
				return;
			}

			var sNumber = Math.max(1,Math.min(SM.Screen.getScreensQuantity(),parseInt(location.hash.split("?")[0].split("#").pop())));
			if(isNaN(sNumber)){
				return undefined;
			} else {
				return sNumber;
			}
		} catch(err){
			return undefined;
		}
	};

	var removeHashFromUrlString = function(url){
		return url.split("#")[0];
	};

	var getSrcFromCSS = function(css){
		try {
			if((typeof css == "string")&&(css.indexOf("url")===0)&&(css.length>3)){
				var quote = css[4];
				if((quote=="\"")||(quote=="'")){
					return css.substring(5,css.length-2);
				} else {
					return css.substring(4,css.length-1);
				}
			}
		} catch(e){}
		return css;
	};

	var getWidthFromStyle = function(style,area){
		return getPixelDimensionsFromStyle(style,area)[0];
	};

	var getHeightFromStyle = function(style,area){
		return getPixelDimensionsFromStyle(style,area)[1];
	};
	
	var getPixelDimensionsFromStyle = function(style,area){
		var dimensions = [];
		var width=null;
		var height=null;

		$.each(style.split(";"), function(index, property){

			//We need to redefine the var in each iteration (due to Android browser issues)
			var width_percent_pattern = /width:\s?([0-9]+(\.[0-9]+)?)%/g
			var width_px_pattern = /width:\s?([0-9]+(\.?[0-9]+)?)px/g
			var height_percent_pattern = /height:\s?([0-9]+(\.[0-9]+)?)%/g
			var height_px_pattern = /height:\s?([0-9]+(\.?[0-9]+)?)px/g

			//Look for property starting by width
			if(property.indexOf("width") !== -1){

				if(property.match(width_px_pattern)){
					//Width defined in px.
					var result = width_px_pattern.exec(property);
					if(result[1]){
						width = result[1];
					}
				} else if(property.match(width_percent_pattern)){
					//Width defined in %.
					var result = width_percent_pattern.exec(property);
					if(result[1]){
						var percent = result[1];
						if(area){
							width = $(area).width()*percent/100;
						}
					}
				}
			} else  if(property.indexOf("height") !== -1){

				if(property.match(height_px_pattern)){
					//height defined in px.
					var result = height_px_pattern.exec(property);
					if(result[1]){
						height = result[1];
					}
				} else if(property.match(height_percent_pattern)){
					//Width defined in %.
					var result = height_percent_pattern.exec(property);
					if(result[1]){
						var percent = result[1];
						if(area){
							height = $(area).height()*percent/100;
						}
					}
				}
			}
		});

		dimensions.push(width);
		dimensions.push(height);
		return dimensions;
	};

	var getFontSizeFromStyle = function(style){
		if(!style){
			return;
		}
		var ft = null;
		$.each(style.split(";"), function(index, property){
			//We need to redefine the var in each iteration (due to some browsers (e.g. Android browser) issues)
			// var font_style_pattern = /font-size:\s?([0-9]+)px/g;
			var font_style_pattern = /font-size\s*:\s*((\d*\.)?\d+)px/i;
			if(property.match(font_style_pattern) != null){
				var result = font_style_pattern.exec(property);
				if ((result!==null)&&(result[1]!==null)) {
					ft = parseFloat(result[1]);
					return false;
				}
			}
		});
		return ft;
	};

	var addFontSizeToStyle = function(style,fontSize){
		if(typeof style !== "string"){
			return null;
		}

		var filterStyle = "";
		$.each(style.split(";"), function(index, property){
			if ((property.indexOf("font-size") === -1)&&(property!=="")) {
				filterStyle = filterStyle + property + "; ";
			}
		});
				
		if(fontSize){
			filterStyle = filterStyle + "font-size:"+fontSize+";";
		}

		return filterStyle;
	};

	var showPNotValidDialog = function(){
		var options = {};
		options.width = 650;
		options.height = 220;
		options.text = SM.I18n.getTrans("i.WrongResource");
		var button1 = {};
		button1.text = SM.I18n.getTrans("i.Ok");
		button1.callback = function(){
			$.fancybox.close();
		}
		options.buttons = [button1];
		SM.Utils.showDialog(options);
	};

	var showDialog = function(options){
		_cleanDialog();

		var rootTemplate = $("#notification_template");
		if($(rootTemplate).length===0){
			return;
		}

		if((!options)||(!options.text)){
			return;
		}
		
		//*Defaults
		var width = '90%';
		var height; //it will be calculated
		var showCloseButton = false;
		var notificationIconSrc;
		if(SM.Editing){
			notificationIconSrc = SM.ImagesPath + "thumbs/content_fail.png";
		}
		
		if(options.width){
			width = options.width;
		}
		if(options.showCloseButton){
			showCloseButton = options.showCloseButton;
		}
		if(options.notificationIconSrc){
			notificationIconSrc = options.notificationIconSrc;
		}

		//Automatically center text when no image is specified in the notification
		if(!notificationIconSrc){
			options.textWrapperClass = "forceCenter";
		}

		//Transform width to px (if not)
		if((typeof width == "string")&&(width.indexOf("%")!=0)){
			width = width.split("%")[0].trim();
			width = (width*$(window).width())/100;
		}

		//*Calculate Height (use root template)
		var notificationParent = $(rootTemplate).parent();
		$(rootTemplate).width(width);
		
		//Fill template
		var text_wrapper = $(rootTemplate).find(".notification_row1");
		var buttons_wrapper = $(rootTemplate).find(".notification_row2");
		var imgIcon = $(text_wrapper).find(".notificationIcon");

		if(notificationIconSrc){
			$(imgIcon).attr("src",notificationIconSrc);
			$(imgIcon).css("display","inline");
		}
		if(options.notificationIconClass){
			$(imgIcon).addClass(options.notificationIconClass);
		}

		if(options.textWrapperClass){
			$(text_wrapper).addClass(options.textWrapperClass);
		}

		if(options.buttonsWrapperClass){
			$(buttons_wrapper).addClass(options.buttonsWrapperClass);
		}

		$(text_wrapper).find(".notification_text").html(options.text);

		if(options.buttons){
			var obLength = options.buttons.length;
			$(options.buttons).reverse().each(function(index,button){
				var bNumber = obLength-index;
				var buttonDOM = $('<a href="#" buttonNumber="'+bNumber+'" class="button notification_button">'+button.text+'</a>');
				if(button.extraclass){
					$(buttonDOM).addClass(button.extraclass);
				}
				$(buttons_wrapper).append(buttonDOM);
			});
		}

		//Look for additional HTML
		if(options.middlerow){
			var middlerow = document.createElement('div');
			$(middlerow).addClass("notification_middlerow");
			$(middlerow).append(options.middlerow);
			if(options.middlerowExtraClass){
				$(middlerow).addClass(options.middlerowExtraClass);
			}
			$(buttons_wrapper).before(middlerow);
		}

		SM.Utils.addTempShown(notificationParent);
		var adjustedHeight = $(text_wrapper).outerHeight(true)+$(buttons_wrapper).outerHeight(true);
		if(options.middlerow){
			var middlerow = $(rootTemplate).find(".notification_middlerow");
			adjustedHeight = adjustedHeight + $(middlerow).outerHeight(true);
		}
		SM.Utils.removeTempShown(notificationParent);

		//*Clone the root template
		var cloneTemplate = $(rootTemplate).clone();
		$(cloneTemplate).attr("id","notification_template_cloned");
		$(notificationParent).append(cloneTemplate);
		var notification = $("#notification_template_cloned");

		//Replace buttons (we need to add the events)
		if(options.buttons){
			buttons_wrapper = $(notification).find(".notification_row2");
			$(buttons_wrapper).html("");
			var obLength = options.buttons.length;
			$(options.buttons).reverse().each(function(index,button){
				var bNumber = obLength-index;
				var buttonDOM = $('<a href="#" buttonNumber="'+bNumber+'" class="button notification_button">'+button.text+'</a>');
				if(button.extraclass){
					$(buttonDOM).addClass(button.extraclass);
				}
				$(buttons_wrapper).append(buttonDOM);

				//Add buttons callback
				$(buttons_wrapper).find(".button[buttonNumber='"+bNumber+"']").click(function(event){
					event.preventDefault();
					button.callback();
				});
			});
		};

		$("a#link_to_notification_template").fancybox({
			'autoDimensions' 	: false,
			'autoScale' 		: true,
			'scrolling'			: 'no',
			'width'				: width,
			'height'			: adjustedHeight,
			'padding' 			: 0,
			'hideOnOverlayClick': true,
			'hideOnContentClick': false,
			'showCloseButton'	: showCloseButton,
			"onStart"  	: function(data){
			},
			"onComplete"  	: function(data){
			},
			"onClosed" : function(data){
				_cleanDialog();
				if((options)&&(typeof options.onClosedCallback == "function")){
					options.onClosedCallback();
				}
			}
		});
		
		$("a#link_to_notification_template").trigger('click');
	};

	var _cleanDialog = function(){
		var notificationWrapper = $("#notification_template_wrapper");
		$(notificationWrapper).html("");
		
		var notificationTemplate = document.createElement('div');
		$(notificationTemplate).attr("id","notification_template");

		var row1 = document.createElement('div');
		$(row1).addClass("notification_row1");
		var img = document.createElement('img');
		$(img).addClass("notificationIcon");
		$(img).attr("style","display:none");
		var span = document.createElement('span');
		$(span).addClass("notification_text");
		$(row1).append(img);
		$(row1).append(span);
		$(notificationTemplate).append(row1);

		var row2 = document.createElement('div');
		$(row2).addClass("notification_row2");
		$(notificationTemplate).append(row2);

		$(notificationWrapper).append(notificationTemplate);
	};

	var isObseleteVersion = function(version){
		return _getVersionValue(SM.VERSION) > _getVersionValue(version);
	};

	var _getVersionValue = function(version){
		var vValue = 0;
		var coef = [100,10,1];
		try {
			var digits = version.split(".");
			for(var i=0; i<digits.length; i++){
				vValue += parseFloat(digits[i])*coef[i];
			}
		} catch (e){
			return 0;
		}
		return vValue;
	};

	var tempShownCounts = {};
	var addTempShown = function(els){
		$(els).each(function(index,el){
			var elId = $(el).attr("id");
			if(typeof elId == "undefined"){
				elId = SM.Utils.getId("TmpShownId");
				$(el).attr("id",elId);
			}
			var tmpShownCount = (typeof tempShownCounts[elId] != "undefined") ? tempShownCounts[elId] : 0;
			tempShownCounts[elId] = tmpShownCount+1;
			if(tmpShownCount==0){
				$(el).addClass("temp_shown");
			}
		});
	};

	var removeTempShown = function(els){
		$(els).each(function(index,el){
			var elId = $(el).attr("id");
			if(typeof elId == "undefined"){
				elId = SM.Utils.getId("TmpShownId");
				$(el).attr("id",elId);
			}
			var tmpShownCount = (typeof tempShownCounts[elId] != "undefined") ? tempShownCounts[elId] : 0;
			var newTmpShownCount = Math.max(0,tmpShownCount-1);
			tempShownCounts[elId] = newTmpShownCount;
			if(newTmpShownCount==0){
				setTimeout(function(){
					if(tempShownCounts[elId]===0){
						$(el).removeClass("temp_shown");
					}
				},1);
			}
		});
	};

	var checkUrlProtocol = function(url){
		if(typeof url == "string"){
			var protocolMatch = (url).match(/^https?:\/\//);
			if((protocolMatch instanceof Array)&&(protocolMatch.length === 1)){
				var urlProtocol = protocolMatch[0].replace(":\/\/","");
				var documentProtocol = SM.Status.getProtocol();
				if(urlProtocol != documentProtocol){
					switch(documentProtocol){
						case "https":
							//Try to load HTTP url over HTTPs
							url = "https" + url.replace(urlProtocol,""); //replace first
							break;
						case "http":
							//Try to load HTTPs url over HTTP
							//Do nothing
							break;
						default:
							//Document is not loaded over HTTP or HTTPs
							break;
					}
				}
			}
		}
		return url;
	};

	var checkWebUrl = function(url){
		if(typeof url !== "string"){
			return url;
		}
		url = checkUrlProtocol(url);
		return url;
	};

	var checkReusablePuzzleInstanceUrl = function(url){
		if(typeof url !== "string"){
			return url;
		}
		url = checkUrlProtocol(url);
		if((SM.Editing)||(SM.Status.isPreview())){
			url = SM.Utils.addParamToUrl(url,"preview","true");
		}

		// var options = SM.Utils.getOptions();
		// if((typeof options !== "undefined")&&(typeof options.escapp !== "undefined")&&(typeof options.escapp.endpoint === "string")){
		// 	try {
		// 		var endpointDomain = new URL(options.escapp.endpoint).hostname;
		// 		var urlDomain = new URL(url).hostname;
		// 		if (endpointDomain === urlDomain) {
		// 			//Add preview param if necessary [...]
		// 		}
		// 	} catch(e){}
		// }

		return url;
	};

	return {
		init 							: init,
		getOptions 						: getOptions,
		getId							: getId,
		isAvailableId					: isAvailableId,
		registerId						: registerId,
		resetIds						: resetIds,
		deepMerge						: deepMerge,
		fixScene						: fixScene,
		getOuterHTML 					: getOuterHTML,
		getSrcFromCSS					: getSrcFromCSS,
		addFontSizeToStyle 				: addFontSizeToStyle,
		getFontSizeFromStyle 			: getFontSizeFromStyle,
		getWidthFromStyle   			: getWidthFromStyle,
		getHeightFromStyle  			: getHeightFromStyle,
		getPixelDimensionsFromStyle 	: getPixelDimensionsFromStyle,
		addParamToUrl					: addParamToUrl,
		removeParamFromUrl				: removeParamFromUrl,
		getParamsFromUrl				: getParamsFromUrl,
		removeHashFromUrlString			: removeHashFromUrlString,
		getScreenNumberFromHash			: getScreenNumberFromHash,
		showDialog 						: showDialog,
		showPNotValidDialog				: showPNotValidDialog,
		isObseleteVersion				: isObseleteVersion,
		addTempShown					: addTempShown,
		removeTempShown					: removeTempShown,
		checkUrlProtocol				: checkUrlProtocol,
		checkWebUrl						: checkWebUrl,
		checkReusablePuzzleInstanceUrl	: checkReusablePuzzleInstanceUrl
	};

}) (SceneMaker);