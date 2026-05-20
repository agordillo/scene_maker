SceneMaker.Actions = (function(SM,$,undefined){
	var _slideIdsAlias;
	var _actionsSlideRevealedFirstTime;
	var _actionsSlideRevealed;
	
	var init = function(scene){
		_slideIdsAlias = {};
		_actionsSlideRevealedFirstTime = {};
		_actionsSlideRevealed = {};

		//Load actions
		if(Array.isArray(scene.actions)){
			var actionsWithEvents = scene.actions.filter(
				item => ((typeof item.event !== "undefined") && (typeof item.event.eventType === "string"))
			);
			//Actions for the slideRevealedFirstTime event
			actionsWithEvents.filter(
				item => ((item.event.eventType === "slideRevealedFirstTime")&&(typeof item.event.eventParams !== "undefined")&&(typeof item.event.eventParams.slide === "string"))
			).forEach(item => {
				var slide = item.event.eventParams.slide;
				if (!_actionsSlideRevealedFirstTime[slide]) {
					_actionsSlideRevealedFirstTime[slide] = {performed: false, actions: []};
				}
				_actionsSlideRevealedFirstTime[slide].actions.push(item);
			});
			//Actions for the slideRevealed event
			actionsWithEvents.filter(
				item => ((item.event.eventType === "slideRevealed")&&(typeof item.event.eventParams !== "undefined")&&(typeof item.event.eventParams.slide === "string"))
			).forEach(item => {
				var slide = item.event.eventParams.slide;
				if (!_actionsSlideRevealed[slide]) {
					_actionsSlideRevealed[slide] = {actions: []};
				}
				_actionsSlideRevealed[slide].actions.push(item);
			});
		}
	};

	var _getSlideIdAlias = function(slideId){
		if(typeof _slideIdsAlias[slideId] === "string"){
			return _slideIdsAlias[slideId];
		}
		return slideId;
	};

	var _registerSlideIdAlias = function(slideId,slideIdAlias){
		if((typeof slideIdAlias !== "string")||(slideIdAlias === slideId)||($("#" + slideIdAlias).length === 0)){
			return;
		}
		for (var _slideId in _slideIdsAlias) {
			if(slideId === _slideIdsAlias[_slideId]){
				if(_slideId === slideIdAlias){
					delete _slideIdsAlias[_slideId];
					continue;
				} else {
					_slideIdsAlias[_slideId] = slideIdAlias;
				}
			}
		}
		_slideIdsAlias[slideId] = slideIdAlias;
	};

	var addActionToHotspot = function(hotspotDOM, action){
		switch(action.actionType){
			case "showText":
				if((action.actionParams)&&(typeof action.actionParams.text === "string")){
					_addTooltip($(hotspotDOM)[0],action.actionParams.text,action.actionParams.delay);
				};
				break;
			default:
				break;
		};
	};

	var addActionToHotzone = function(hotzoneDOM, action){
		switch(action.actionType){
			case "showText":
				if((action.actionParams)&&(typeof action.actionParams.text === "string")){
					_addTooltip($(hotzoneDOM)[0],action.actionParams.text,action.actionParams.delay);
				};
				break;
			default:
				break;
		};
	};

	var refreshHotzoneAction = function(hotzoneDOM, action){
		return addActionToHotzone(hotzoneDOM, action);
	};

	var _addTooltip = function(elementDOM,text,delay){
		if(typeof $(elementDOM).attr("markertooltipid") !== "undefined"){
			return;
		}
		let delayValue = 0;
		if(typeof delay === "string"){
			let delayValueParam = parseInt(delay, 10);
			if (!Number.isNaN(delayValueParam) && delayValueParam > 0) {
				delayValue = delayValueParam*1000;
			}
		}

		tippy(elementDOM, {
			content: text,
			trigger: 'click',
			placement: 'top',
			inlinePositioning: true,
			arrow: true,
			theme: '',
			animation: 'scale', //fade, scale,
			duration: 1000,
			inertia: false,
			interactive: false,
			interactiveBorder: 2,
			hideOnClick: true,
			maxWidth: 'none',
			offset: [2, 6],
			delay: [delayValue, 0],
			popperOptions: {
				modifiers: [
					{ name: 'eventListeners', options: { scroll: false, resize: false } },
				],
			},
			onCreate(instance) {
				var toolTipId = instance.popper.id;
				$(elementDOM).attr("markertooltipid",toolTipId);
			}
		});
	};

	var performActions = function(actions,eventTargetId){
		if (Array.isArray(actions)) {
			actions.forEach((action, index) => {
				_performAction(action,eventTargetId);
			});
		}
	};

	var _performAction = function(action,eventTargetId){
		if((action)&&(action.actionParams)&&(typeof action.actionParams.delay === "string")){
			const delayValue = parseInt(action.actionParams.delay, 10);
			if (!Number.isNaN(delayValue) && delayValue > 0) {
				setTimeout(function(){
					_performActionWithoutDelay(action,eventTargetId);
				}, (delayValue*1000));
				return;
			}
		}
		_performActionWithoutDelay(action,eventTargetId);
		return;
	};

	var _performActionWithoutDelay = function(action,eventTargetId){
		switch(action.actionType){
			case "goToScreen":
				if((action.actionParams)&&(typeof action.actionParams.screen === "string")){
					var screenId = _getSlideIdAlias(action.actionParams.screen);
					var $screen = $("#" + screenId);
					if ($screen.length > 0) {
						SM.Screen.goToScreenWithNumber($screen.attr("slideNumber"));
					}
				}
				break;
			case "openView":
				if((action.actionParams)&&(typeof action.actionParams.view === "string")){
					var viewId = action.actionParams.view;
					var $view = $("#" + viewId);
					if ($view.length > 0) {
						SM.View.openView(viewId);
					}
				}
				break;	
			case "openLink":
				if((action.actionParams)&&(typeof action.actionParams.url === "string")){
					window.open(action.actionParams.url, '_blank', 'noopener,noreferrer');
				}
				break;
			case "showText":
				//Do nothing. Tooltips are handled automatically by Tippy.
				// if((action.actionParams)&&(typeof action.actionParams.text === "string")){
				// 	alert(action.actionParams.text);
				// };
				break;
			case "changeBackground":
				if((action.actionParams)&&(typeof action.actionParams.slide === "string")&&(typeof action.actionParams.url === "string")){
					SM.Slides.changeSlideBackground($("#" + action.actionParams.slide),action.actionParams.url);
				}
				break;
			case "changeScreen":
				if((action.actionParams)&&(typeof action.actionParams.screen === "string")&&(typeof action.actionParams.screenReplacement === "string")){
					var screenId = action.actionParams.screen;
					var screenReplacementId = action.actionParams.screenReplacement;
					_registerSlideIdAlias(screenId,screenReplacementId);
					if($(SM.Screen.getCurrentScreen()).attr("id") === screenId){
						_performAction({actionType: "goToScreen", actionParams:{screen: screenId}});
					}
				}
				break;
			case "showHotspot":
			case "hideHotspot":
				if((action.actionParams)&&(typeof action.actionParams.hotspotId === "string")){
					var hotspotId = action.actionParams.hotspotId;
					var $hotspot = $("#" + hotspotId);
					if ($hotspot.length > 0) {
						if(action.actionType === "showHotspot"){
							$hotspot.show();
						} else {
							$hotspot.hide();
						}
					}
				}
				break;
			case "enableHotzone":
				if((action.actionParams)&&(typeof action.actionParams.hotzoneId === "string")){
					SM.Marker.enableHotzone(action.actionParams.hotzoneId);
				}
				break;
			case "disableHotzone":
				if((action.actionParams)&&(typeof action.actionParams.hotzoneId === "string")){
					SM.Marker.disableHotzone(action.actionParams.hotzoneId);
				}
				break;
			case "playSound":
				if((action.actionParams)&&(typeof action.actionParams.url === "string")){
					SM.Audio.HTML5.playAudio(action.actionParams.url, (action.actionParams.loop === true));
				}
				break;
			case "stopSound":
				if((action.actionParams)&&(typeof action.actionParams.url === "string")){
					SM.Audio.HTML5.stopAudio(action.actionParams.url);
				}
				break;
			case "solvePuzzle":
				if((action.actionParams)&&(typeof action.actionParams.puzzleId === "string")){
					SM.Escapp.submitPuzzleSolution(action.actionParams.puzzleId,eventTargetId);
				}
				break;
			default:
				break;
		}
	};

	var checkActionsForSlideEnterEvent = function(slideId){
		if(typeof _actionsSlideRevealedFirstTime[slideId] !== "undefined"){
			if(_actionsSlideRevealedFirstTime[slideId].performed !== true){
				_actionsSlideRevealedFirstTime[slideId].performed = true;
				performActions(_actionsSlideRevealedFirstTime[slideId].actions);
			}
		}
		if(typeof _actionsSlideRevealed[slideId] !== "undefined"){
			performActions(_actionsSlideRevealed[slideId].actions);
		}
	};

	return {
		init 							: init,
		addActionToHotspot				: addActionToHotspot,
		addActionToHotzone				: addActionToHotzone,
		refreshHotzoneAction			: refreshHotzoneAction,
		performActions					: performActions,
		checkActionsForSlideEnterEvent	: checkActionsForSlideEnterEvent
	};

}) (SceneMaker, jQuery);