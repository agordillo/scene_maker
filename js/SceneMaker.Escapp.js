SceneMaker.Escapp = (function(SM,$,undefined){
	var _escapp;
	var _puzzlesSolved;
	var _linkedPuzzleIds;
	var _relatedPuzzleIds;
	var _actionsForRelatedPuzzles;
	var _escappInitialized;
	var _actionsRendering;

	var init = function(options, scene, callback){
		_puzzlesSolved = [];
		_actionsForRelatedPuzzles = {};
		_linkedPuzzleIds = _getLinkedPuzzleIdsForScene(scene);
		_relatedPuzzleIds = _getRelatedPuzzleIdsForScene(scene);

		if((_linkedPuzzleIds.length === 0)&&(_relatedPuzzleIds.length === 0)){
			//No need to use Escapp.
			return callback(scene,undefined);
		}
		if(SM.Status.isPreview() === true){
			return callback(scene,undefined);
		}

		var defaultEscappSettings = _getDefaultEscappSettings(options, scene);
		var escappSettings = SM.Utils.deepMerge((options.escapp || {}), defaultEscappSettings);

		//Add callbacks
		escappSettings.onNewErStateCallback = function(erState){
			_updateSceneState(erState);
		};
		// escappSettings.onErRestartCallback = function(erState){
		// 	// SM.Debugging.log("onErRestartCallback", erState);
		// };

		_escapp = new ESCAPP(escappSettings);
		SM.Debugging.log("Escapp client initiated with settings:", _escapp.getSettings());

		//Authenticate user in Escapp
		try {
			_escappInitialized = false;
			_escapp.validate((success, erState) => {
				try {
					if(_escappInitialized===true) return;
					_escappInitialized = true;

					SM.Debugging.log("Escapp validation", success, erState);
					if((success)&&(typeof erState !== "undefined")&&(Array.isArray(erState.puzzlesSolved))&&(erState.puzzlesSolved.length > 0)){
						var updatedScene = _updateSceneJSONBasedOnInitialErState(scene,erState);
						return callback(updatedScene,erState);
					} else {
						return callback(scene,undefined);
					}
				}catch(e){
					SM.Debugging.log("Error in escapp validate callback", e);
					callback(scene, undefined);
				};
			});
		} catch (e){
			SM.Debugging.log("Error in escapp validate", e);
			callback(scene, undefined);
		}
	};

	var _getDefaultEscappSettings = function(options, scene){
		var settings = {
			imagesPath: SM.ImagesPath + "libs/escapp/",
			linkedPuzzleIds: _linkedPuzzleIds,
			relatedPuzzleIds: _relatedPuzzleIds,
			preview: SM.Status.isPreview(),
			silent: (SM.Debugging.isDevelopping()!==true),
			forceValidation: (SM.Debugging.isDevelopping()!==true),
			notifications: "FALSE",
			rtc: true,
			restoreState: "AUTO",
			I18n: {
				locale: SM.I18n.getLanguage(),
			}
		};
		if(typeof options.user !== "undefined"){
			settings.user = options.user;
		}
		return settings;
	};

	var _getLinkedPuzzleIdsForScene = function(scene){
		if(!Array.isArray(scene.screens)) return [];

		var linkedPuzzleIds = [];
		for (var screen of scene.screens) {
			linkedPuzzleIds = linkedPuzzleIds.concat(_getLinkedPuzzleIdsForScreen(screen));
		}

		//Remove duplicates and convert to numbers
		linkedPuzzleIds = [...new Set(linkedPuzzleIds
		.map(Number)
		.filter(n => !isNaN(n))
		)].sort((a, b) => a - b);

		return linkedPuzzleIds;
	};

	var _getLinkedPuzzleIdsForScreen = function(screen){
		var linkedPuzzleIds = _getLinkedPuzzleIdsFromMarkers(screen);
		if(Array.isArray(screen.views)){
			for (var viewIndex in screen.views) {
				var view = screen.views[viewIndex];
				linkedPuzzleIds = linkedPuzzleIds.concat(_getLinkedPuzzleIdsFromMarkers(view));
			}
		}
		return linkedPuzzleIds;
	};

	var _getLinkedPuzzleIdsFromMarkers = function(slide){
		var linkedPuzzleIds = [];

		if(Array.isArray(slide.hotspots)){
			for (var hotspotIndex in slide.hotspots) {
				var hotspot = slide.hotspots[hotspotIndex];
				linkedPuzzleIds = linkedPuzzleIds.concat(_getLinkedPuzzleIdsFromActions(hotspot.actions));
			}
		}

		if(Array.isArray(slide.hotzones)){
			for (var hotzoneIndex in slide.hotzones) {
				var hotzone = slide.hotzones[hotzoneIndex];
				linkedPuzzleIds = linkedPuzzleIds.concat(_getLinkedPuzzleIdsFromActions(hotzone.actions));
			}
		}
		
		return linkedPuzzleIds;
	};

	var _getLinkedPuzzleIdsFromActions = function(actions){
		var linkedPuzzleIds = [];
		if (Array.isArray(actions)){
			for (var actionIndex in actions) {
				var action = actions[actionIndex];
				if((action.actionType === "solvePuzzle")&&(typeof action.actionParams !== "undefined")&&(typeof action.actionParams.puzzleId === "string")){
					linkedPuzzleIds.push(action.actionParams.puzzleId);
				}
			};
		}
		return linkedPuzzleIds;
	};

	var _getRelatedPuzzleIdsForScene = function(scene){
		var relatedPuzzleIds = _getRelatedPuzzleIdsFromActions(scene.actions);
		//Include _linkedPuzzleIds
		relatedPuzzleIds = (relatedPuzzleIds.map(Number).filter(n => !isNaN(n))).concat(_linkedPuzzleIds);

		//Remove duplicates
		relatedPuzzleIds = [...new Set(relatedPuzzleIds)].sort((a, b) => a - b);

		return relatedPuzzleIds;
	};

	var _getRelatedPuzzleIdsFromActions = function(actions){
		var relatedPuzzleIds = [];
		if (Array.isArray(actions)){
			for (var actionIndex in actions) {
				var action = actions[actionIndex];
				if(typeof action.event !== "undefined"){
					var event = action.event;
					if((event.eventType === "puzzleSolved")&&(typeof event.eventParams !== "undefined")&&(typeof event.eventParams.puzzleId === "string")){
						var puzzleId = Number(event.eventParams.puzzleId);
						if (!Number.isNaN(puzzleId)) {
							relatedPuzzleIds.push(puzzleId);
							if(typeof _actionsForRelatedPuzzles[puzzleId] === "undefined"){
								_actionsForRelatedPuzzles[puzzleId] = [];
							}
							_actionsForRelatedPuzzles[puzzleId].push(action);
						}
					}
				}
			};
		}
		return relatedPuzzleIds;
	};

	var _updateSceneJSONBasedOnInitialErState = function(scene, erState){
		_actionsRendering = _getActionsFromNewSolvedPuzzles(erState);
		if(!Array.isArray(_actionsRendering)) return scene;

		let hotspotsToShow = new Set();
		let hotspotsToHide = new Set();
		let hotzonesToEnable = new Set();
		let hotzonesToDisable = new Set();

		_actionsRendering.forEach(action => {
		    switch (action.actionType) {
				case "showHotspot":
		            if((action.actionParams && typeof action.actionParams.hotspotId === "string")){
						hotspotsToShow.add(action.actionParams.hotspotId);
					}
		            break;
		        case "hideHotspot":
		           	if((action.actionParams && typeof action.actionParams.hotspotId === "string")){
						hotspotsToHide.add(action.actionParams.hotspotId);
					}
		            break;
				case "enableHotzone":
					if((action.actionParams && typeof action.actionParams.hotzoneId === "string")){
						hotzonesToEnable.add(action.actionParams.hotzoneId);
					}
					break;
				case "disableHotzone":
					if((action.actionParams && typeof action.actionParams.hotzoneId === "string")){
						hotzonesToDisable.add(action.actionParams.hotzoneId);
					}
					break;
		        default:
		            break;
		    }
		});

		scene.screens.forEach(screen => {
		    if (Array.isArray(screen.hotspots)) {
		        screen.hotspots.forEach(hotspot => {
		            if(hotspot.visibility==="visible"){
		            	if(hotspotsToHide.has(hotspot.id)){
		            		hotspot.visibility = "hidden";
		            	}
		            } else {
		            	if(hotspotsToShow.has(hotspot.id)){
		            		hotspot.visibility = "visible";
		            	}
		            }
		        });
		    }
		    if (Array.isArray(screen.hotzones)) {
		        screen.hotzones.forEach(hotzone => {
		            if(hotzone.enabled===true){
		            	if(hotzonesToDisable.has(hotzone.id)){
		            		hotzone.enabled = false;
		            	}
		            } else {
		            	if(hotzonesToEnable.has(hotzone.id)){
		            		hotzone.enabled = true;
		            	}
		            }
		        });
		    }
		});
		return scene;
	};

	var updateSceneStateAfterRendering = function(){
		if(!Array.isArray(_actionsRendering)) return;
		//Remove actions previously applied through _updateSceneJSONBasedOnInitialErState
		//"playSound" and "stopSound" actions are also removed because autoplay is not usually allowed
		const actionsToRemove = new Set(["showHotspot","hideHotspot","enableHotzone","disableHotzone","playSound","stopSound"]);
		var _actions = _actionsRendering.filter(action => !actionsToRemove.has(action.actionType));
		SM.Actions.performActions(_actions);
	};

	var _updateSceneState = function(erState, afterSubmitPuzzle=false){
		var _actions = _getActionsFromNewSolvedPuzzles(erState);
		if(!Array.isArray(_actions)) return;
		SM.Actions.performActions(_actions);
	};

	var _getActionsFromNewSolvedPuzzles = function(erState){
		if((typeof erState === "undefined")||(!Array.isArray(erState.puzzlesSolved))) return;
		var newPuzzles = erState.puzzlesSolved.filter(
			puzzleId => !_puzzlesSolved.includes(puzzleId) && _relatedPuzzleIds.includes(puzzleId)
		).sort((a, b) => a - b);
		if(newPuzzles.length === 0){
			return;
		}
		var actions = [];
		newPuzzles.forEach(function(puzzleId) {
			_puzzlesSolved.push(puzzleId);
			var actionsForPuzzle = _actionsForRelatedPuzzles[puzzleId];
			if (!Array.isArray(actionsForPuzzle)) {
				return;
			}
			actions = actions.concat(JSON.parse(JSON.stringify(actionsForPuzzle)));
		});
		_puzzlesSolved = _puzzlesSolved.sort((a, b) => a - b);
		if(actions.length === 0){
			return;
		}
		var maxSolvedPuzzle = Math.max(...newPuzzles);
		actions = _optimizeActions(actions,maxSolvedPuzzle);
		return actions;
	};

	var _optimizeActions = function(actions,maxSolvedPuzzle){
		//If there are several actions with type "goToScreen" or "openView", apply only the last one.
		var lastIndexSlideMovement = actions.map(a => a.actionType).reduce((last, type, i) => 
			(type === "goToScreen" || type === "openView") ? i : last, -1
		);
		actions = actions.filter((a, i) =>
			!(a.actionType === "goToScreen" || a.actionType === "openView") || i === lastIndexSlideMovement
		);

		//If there are several actions with type "playSound", apply only the ones from the last solved puzzle
		actions = actions.filter(action => {
			if (action.actionType !== "playSound") return true;
			return action.event?.eventParams?.puzzleId == maxSolvedPuzzle;
		});

		//If there are multiple showHotspot or hideHotspot actions over a same hotspot, keep the latest.
		actions = _optimizeHotspotStateActions(actions);

		//If there are multiple enableZone or disableZone actions over a same hotzone, keep the latest.
		actions = _optimizeHotzoneStateActions(actions);

		return actions;
	};

	function _optimizeHotspotStateActions(actions) {
		const seenHotspots = new Set();
		const result = [];

		for (let i = actions.length - 1; i >= 0; i--) {
			const action = actions[i];
			const isHotspotAction =
				action.actionType === "showHotspot" ||
				action.actionType === "hideHotspot";
			if (!isHotspotAction) {
				result.push(action);
				continue;
			}
			if(typeof action.actionParams === "undefined"){
				continue;
			}
			const hotspotId = action.actionParams.hotspotId;
			if(typeof hotspotId !== "string"){
				continue;
			}

			if (!seenHotspots.has(hotspotId)) {
				seenHotspots.add(hotspotId);
				result.push(action);
			}
		}
		return result.reverse();
	};

	function _optimizeHotzoneStateActions(actions) {
		const seenHotzones = new Set();
		const result = [];

		for (let i = actions.length - 1; i >= 0; i--) {
			const action = actions[i];
			const isHotzoneAction =
				action.actionType === "enableHotzone" ||
				action.actionType === "disableHotzone";
			if (!isHotzoneAction) {
				result.push(action);
				continue;
			}
			if(typeof action.actionParams === "undefined"){
				continue;
			}
			const hotzoneId = action.actionParams.hotzoneId;
			if(typeof hotzoneId !== "string"){
				continue;
			}
			if (!seenHotzones.has(hotzoneId)) {
				seenHotzones.add(hotzoneId);
				result.push(action);
			}
		}
		return result.reverse();
	};

	var submitPuzzleSolution = function(_puzzleId, puzzleSolution){
		var puzzleId = Number(_puzzleId);
		if((!isNaN(puzzleId))&&(_linkedPuzzleIds.includes(puzzleId))&&(!_puzzlesSolved.includes(puzzleId))){
			if(SM.Status.isPreview() !== true){
				if(typeof _escapp !== "undefined"){
					_escapp.submitPuzzle(puzzleId, puzzleSolution, {}, (success, res) => {
						//SM.Debugging.log("Solution submitted to Escapp", puzzleId, puzzleSolution, success, res);
						if (success && res && res.erState) {
							_updateSceneState(res.erState, true);
						}
					});
				}
			} else {
				//Preview
				var erState = {puzzlesSolved: JSON.parse(JSON.stringify(_puzzlesSolved))};
				erState.puzzlesSolved.push(puzzleId);
				_updateSceneState(erState, true);
			}
		}
	};

	var getEscapp = function(){
		return _escapp;
	};

	return {
		init 							: init,
		updateSceneStateAfterRendering	: updateSceneStateAfterRendering,
		getEscapp 						: getEscapp,
		submitPuzzleSolution			: submitPuzzleSolution
	};

}) (SceneMaker, jQuery);