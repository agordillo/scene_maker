VISH.Editor.Tools.Menu = (function(V,$,undefined){

	var _initialized = false;
	var _hoverMenu = false;
	
	/*
	 * Init singleton
	 * Perform actions that must be executed only once
	 */
	var init = function(){
		if(!_initialized){
			_hoverMenu = true;
			
			//Add listeners to menu buttons
			$.each($("#menu a.menu_action"), function(index, menuButton) {
				$(menuButton).on("click", function(event){
					event.preventDefault();
					if($(menuButton).parent().hasClass("menu_item_disabled")){
						//Disabled button
						return false;
					}
					if(typeof V.Editor.Tools.Menu[$(menuButton).attr("action")] == "function"){
						V.Editor.Tools.Menu[$(menuButton).attr("action")](this);
						_hideMenuAfterAction();
					}
					return false;
				});
			});

			//Prevent iframe to move
			$("a.menu_option_main, a.menu_option:not('.menu_action')").on("click", function(event){
				event.preventDefault();
				return false;
			});
			
			//EditorAdapter
			var options = V.Utils.getOptions();
			//Check exit option in menu
			if(typeof options.exitURL != "string"){
				$(".menu_option.menu_action[action='exit']").parent().hide();
			} else {
				V.exitPath = options.exitURL;
			}
			
			_initialized = true;
		}
		$("#menu").show();

		//menu click show withouth css instead of hover
		var _submenu = false;
	
		$("a:.menu_option_main").on('click',function(){
			if($("#menu li > ul.menu_option_main").css('display') === 'none' ){
				$("#menu li > ul.menu_option_main").css('display','block');
				$("ul:.menu_option_main li").hover(function(e){
					$(this).children('ul').css('display','block').on('mouseenter',function(){
						_submenu = true;
						$(this).mouseleave(function(e){
							_submenu= false;
						})
					});
				}, function(){
					if (!_submenu){
						$("ul:.menu_option_main li > ul").css('display','none');
					}
				});
			} else {
				$("#menu li > ul.menu_option_main").css('display','none');
			}
		});
		$(document).click( function(){
			$("#menu li > ul.menu_option_main").hide();
		});
	};

	var _enableMenuItem = function(items){
		// $(items).show();
		$(items).removeClass("menu_item_disabled").addClass("menu_item_enabled");
	};

	var _disableMenuItem = function(items){
		// $(items).hide();
		$(items).removeClass("menu_item_enabled").addClass("menu_item_disabled");
	};

	var disableMenu = function(){
		$("#menu").hide();
		$("#menu").attr("id","menuDisabled");
	};

	var enableMenu = function(){
		$("#menuDisabled").show();
		$("#menuDisabled").attr("id","menu");
	};


	//////////////////
	/// SAVE
	/////////////////

	var onSaveButtonClicked = function(){
		if(V.Slides.getSlides().length === 0){
			var options = {};
			options.width = 600;
			options.height = 150;
			options.text = V.I18n.getTrans("i.NoSlidesOnSaveNotification");
			var button1 = {};
			button1.text = V.I18n.getTrans("i.Ok");
			button1.callback = function(){
				$.fancybox.close();
			}
			options.buttons = [button1];
			V.Utils.showDialog(options);
			return;
		}

		V.Editor.Tools.changeSaveButtonStatus("loading");
		var presentation = V.Editor.savePresentation();
		V.Editor.sendPresentation(presentation,"save",function(){
			//onSave succesfully
			// V.Debugging.log("onSave succesfully");
			// V.Debugging.log(presentation);
			V.Editor.Tools.changeSaveButtonStatus("disabled");
		}, function(){
			//error onSave
			// V.Debugging.log("onSave failure");
			V.Editor.Tools.changeSaveButtonStatus("enabled");
		});
	};

	/////////////////////
	/// PREVIEW
	///////////////////////

	var preview = function(){
		V.Editor.Preview.preview();
	};

	////////////////
	//More Actions
	///////////////

	var exit = function(){

		if(V.Editor.hasPresentationChanged()){
			var options = {};
			options.width = 600;
			options.height = 200;
			options.notificationIconSrc = V.ImagesPath + "icons/save_document.png";
			// options.notificationIconClass = "publishNotificationIcon";
			options.text = V.I18n.getTrans("i.exitConfirmationMenu");
			options.buttons = [];

			var button1 = {};
			button1.text = V.I18n.getTrans("i.cancel");
			button1.callback = function(){
				$.fancybox.close();
			}
			options.buttons.push(button1);

			var button2 = {};
			button2.text = V.I18n.getTrans("i.ExitWSaving");
			button2.callback = function(){
				_exitFromVE();
				$.fancybox.close();
			}
			options.buttons.push(button2);

			var button3 = {};
			button3.text = V.I18n.getTrans("i.SaveAndExit");
			button3.callback = function(){
				$("#waiting_overlay").show();
				V.Editor.Tools.changeSaveButtonStatus("loading");
				var presentation = V.Editor.savePresentation();
				V.Editor.sendPresentation(presentation,"save",function(){
					//onSave succesfully
					V.Editor.Tools.changeSaveButtonStatus("disabled");
					_exitFromVE();
				}, function(){
					//error onSave
					V.Editor.Tools.changeSaveButtonStatus("enabled");
					$("#waiting_overlay").hide();
				});
				$.fancybox.close();
			}
			options.buttons.push(button3);

			V.Utils.showDialog(options);

		} else {
			_exitFromVE();
		}
	};

	var _exitFromVE = function(){
		V.Editor.Events.allowExitWithoutConfirmation();
		window.top.location.href = V.exitPath;
	};

	var addScreen = function(){
		$("#addScreenButton").trigger('click');
		return false; //Prevent iframe to move
	};

	var insertSubslide = function(){
		V.Editor.setContentAddMode(V.Constant.SLIDESET);
		$("#addSlideFancybox").trigger('click');
		V.Editor.Utils.loadTab('tab_views');
		return false; //Prevent iframe to move
	};

	var displaySettings = function(){
		V.Editor.Settings.displaySettings();
	};

	var _hideMenuAfterAction = function(){
		if(_hoverMenu){
			$("#menu ul.menu_option_main").addClass("temp_hidden");
			setTimeout(function(){
				$("#menu ul.menu_option_main").removeClass("temp_hidden");
			},500);
		}
	};

	return {
		init							: init,
		disableMenu 					: disableMenu,
		enableMenu 						: enableMenu,
		addScreen						: addScreen,
		insertSubslide					: insertSubslide,
		displaySettings					: displaySettings, 
		onSaveButtonClicked 			: onSaveButtonClicked,
		preview 						: preview,
		exit 							: exit
	};

}) (VISH, jQuery);