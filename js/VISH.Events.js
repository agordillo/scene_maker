/*
 * Events for Viewer
 */
VISH.Events = (function(V,$,undefined){

	var _bindedViewerEventListeners = false;

	var init = function(){
		bindViewerEventListeners();
	};

	var bindViewerEventListeners = function(){
		if(_bindedViewerEventListeners){
			return;
		}

		//Enter and leave events
		$('article').live('slideenter', V.Viewer.onSlideEnterViewer);
		$('article').live('slideleave', V.Viewer.onSlideLeaveViewer);

		$(document).on('click','.close_subslide', V.Screen.onCloseSubslideClicked);

		//Focus
		$(window).focus(function(){
			V.Status.setWindowFocus(true);
		}).blur(function(){
			V.Status.setWindowFocus(false);
		});

		//Load onresize event
		//Prevent multiple consecutively calls
		var multipleOnResize = undefined;
		window.onresize = function(){
			if(typeof multipleOnResize == "undefined"){
				multipleOnResize = false;
				setTimeout(function(){
					if(!multipleOnResize){
						multipleOnResize = undefined;
						_onResizeActions();
					} else {
						multipleOnResize = undefined;
						window.onresize();
					}
				},600);
			} else {
				multipleOnResize = true;
			}
		};

		$(window).on('orientationchange',function(){
			$(window).trigger('resize'); //It will call V.ViewerAdapter.updateInterface();
		});

		window.onbeforeunload = function(){
			V.EventsNotifier.notifyEvent(V.Constant.Event.exit);
		};

		_bindedViewerEventListeners = true;
	};


	var _onResizeActions = function(){
		var fsParams = V.FullScreen.getFSParams();

		if(typeof fsParams.currentFSElement == "undefined"){
			//Browser is not in fullscreen.
			if((typeof fsParams.lastFSElement != "undefined")&&(fsParams.lastFSElement != fsParams.fsElementTarget)&&((new Date() - fsParams.lastFSTimestamp)<1000)){
				//Another element has left from FS
				if($("body").is(":-webkit-full-screen-ancestor")){
					//Another element has left from FS in Chrome in a non appropriate way
					//Try to prevent/fix Chrome bug
					if(fsParams.lastFSElement.tagName === "IFRAME"){
						$(fsParams.lastFSElement).attr("src",$(fsParams.lastFSElement).attr("src"));
					}
				}
			}
		} else {
			//Browser is in fullscreen
			if((typeof fsParams.currentFSElement != "undefined")&&(fsParams.currentFSElement != fsParams.fsElementTarget)){
				//Another element is in fs now.
				return;
			}
		}

		//After Resize actions
		V.Status.refreshDeviceAfterResize();

		var currentDevice = V.Status.getDevice();
		V.EventsNotifier.notifyEvent(V.Constant.Event.onViewportResize,{screen: currentDevice.screen, viewport: currentDevice.viewport});
		
		V.ViewerAdapter.updateInterface();
	};

	return {
			init 							: init,
			bindViewerEventListeners		: bindViewerEventListeners
	};

}) (VISH,jQuery);