/*
$(document).bind("contextmenu", function(e) {
        e.preventDefault();
    });
*/
var kiosk = function () {
    var keyboardDropTime = 300;
    var activateKeyboard = true;
    var scannedCode = "";
    var shiftPressed = false;
    var pressTimer;
    
    var _keyboardSelector = null;

    var settings = {
      showAlways:true,
      autoStart: false,
      longPressTimer: 500
    };



    var navigateBack = function() {
        if (history.length > 0)
            history.back(-1);
        },
        scrollToEnd = function(input) {
            $("html, body").animate({ scrollTop: $(document).height() }, "slow");
        },
        hideEmptyInventory = function() {
            if ($(".store-name").length === 0) {
                $(".product-inventory").hide();
            }
        },
        showKeyboard = function (scroll) {
            $(".navbar").slideDown();

            $(".kiosk-keyboard-scrollarea").show();
            if (scroll) {
                scrollToEnd();
            }

            // start checking incase user is using keyboard instead
            $(document).on('keypress', null, null, onKeyboardPress);
        },
        onKeyboardPress = function () {
            onInputLostFocus();
            $(document).off('keypress');
        },
        hideKeyboard = function () {
          if (settings.showAlways)
            return;
          
            $(".kiosk-keyboard-scrollarea").hide();
            $(".navbar").slideUp();
        },
        changeCursorPosition = function(event) {
            document.cursorPosition = $(this)[0].selectionStart;
        },
        clearCursorTracking = function (ctrl) {
            if (ctrl) {
                $(ctrl)
                    .on('keypress', changeCursorPosition)
                    .on('keydown', changeCursorPosition)
                    .on('mousedown', changeCursorPosition);
            }
        },
        startCursorTracking = function(ctrl) {
                if (ctrl) {
                    $(ctrl)
                        .on('keypress', changeCursorPosition)
                        .on('keydown', changeCursorPosition)
                        .on('mousedown', changeCursorPosition);
            }
        },
        onInputGainFocus = function (ctrl) {
            console.log("gained focus: " + ctrl.name);

            if (ctrl) {
                
                // if we were already tracking an input control, stop tracking it
                if (document.keyboardInput) {
                    clearCursorTracking(document.keyboardInput);
                }

                // set this control to the active input control and start tracking it
                document.keyboardInput = ctrl;
                startCursorTracking(ctrl);

                // handle the displaying of the keyboard if not already displayed.
                if (!document.showKeyboard) {
                    document.showKeyboard = true;
                var scroll = $(ctrl).hasClass("scroll-on-focus");
                showKeyboard(scroll);
              }
            }
            
            console.log("keyboard input: " + document.keyboardInput.name);
        },
        onInputLostFocus = function (ctrl) {
            console.log("lost focus: " + ctrl);

            // stop tracking this control
                if (ctrl) {
                clearCursorTracking(ctrl);
                }

            // hide the keyboard if it's currently being displayed.
            if (document.showKeyboard) {
                document.showKeyboard = false;
                setTimeout(function() {
                    if (!document.showKeyboard) {
                        hideKeyboard();
                    }
                }, keyboardDropTime);
            }
        },
        updateKeyState = function(isAlt) {
            console.log('updateKeyState');
            // update the keyboard
            if (isAlt){
                return;
            }
            var keyboard = $(_keyboardSelector);
            if (keyboard) {
                var capsKey = keyboard.find(".btn-caps");
                var leftShiftKey = keyboard.find(".btn-shift-left");
                var rightShiftKey = keyboard.find(".btn-shift-right");

                keyboard.removeClass('keyboard-caps');
                capsKey.removeClass('selected');
                leftShiftKey.removeClass('selected');
                rightShiftKey.removeClass('selected');

                if (document.keyboardCaps) {
                    capsKey.addClass('selected');
                    keyboard.addClass('keyboard-caps');
                }
                
                if (document.keyboardShift) {
                    leftShiftKey.addClass('selected');
                    rightShiftKey.addClass('selected');
                    keyboard.addClass('keyboard-caps');   
                }
            }
        },
        toggleAltValues = function(){
            $('.btn-key[data-alt]').each(function(i,e){
                var k = e.getAttribute('data-key');
                var a = e.getAttribute('data-alt');
                e.setAttribute('data-key',a);
                e.setAttribute('data-alt',k)
                e.innerText = a;
            })
        },
        onKeyPress = function (key,isAlt) {
            if (key) {
                if (!$(key).hasClass('disabled')) {
                    var keyData = $(key).data('key');

                    // grab the "long-press" character
                    if (isAlt){
                        keyData = $(key).data('alt');
                    }
                    // "long-press" will also trigger normal-press, so bail if that's the case.
                    if (!isAlt && key.handled){
                        key.handled = false;
                        // cleanup from long-press
                        setTimeout(function(){
                            $(key).removeClass('key-held');
                            updateKeyState(false);
                        },200);
                        
                        return;
                    }

                    if (keyData !== null) {
                        
                        // handle shift key pressed
                        if (keyData === 'shift') {
                            if (document.keyboardCaps) {
                                document.keyboardShift = false;
                            } else {
                                document.keyboardShift = !(document.keyboardShift);
                            }
                            updateKeyState(isAlt);
                            document.keyboardInput.setSelectionRange(document.caretPosition, document.caretPosition);
                            return;
                        }
                        
                        // handle caps key pressed
                        if (keyData === 'caps') {
                            if (document.keyboardShift) {
                                document.keyboardShift = false;
                            }

                            document.keyboardCaps = !(document.keyboardCaps);
                            updateKeyState(isAlt);
                            document.keyboardInput.setSelectionRange(document.caretPosition, document.caretPosition);
                            return;
                        }
                        
                        var value = $(document.keyboardInput).val();
                        
                            // handle backspace key pressed
                            // note: this does not handle cursor position at this time.
                            if (keyData === 'bksp') {
                                if (value.length > 0) {
                                    if (document.caretPosition > 0) {
                                        value = value.substring(0, document.caretPosition-1)+value.substring(document.caretPosition, value.length);
                                        document.caretPosition--;
                                    }
                                    
                                    $(document.keyboardInput).val(value);
                                }
                                if (document.hasValidated) {
                                    $(document.keyboardInput).valid();
                                }
                                document.keyboardInput.setSelectionRange(document.caretPosition, document.caretPosition);
                                return;
                            }

                            if (keyData === 'clr'){
                                $(document.keyboardInput).val('');
                                document.keyboardInput.setSelectionRange(0,0);
                                return;
                            }

                            // all other keys
                        if (document.keyboardInput) {
                            if (keyData === 'enter') {
                                $(document.keyboardInput).closest('form').validate();
                                document.hasValidated = true;
                                $(document.keyboardInput).closest('form').submit();
                            } else {
                                if ((document.keyboardCaps || document.keyboardShift) && keyData != null) {
                                    keyData = keyData.toString().toUpperCase();
                                }
                                value = value.substring(0, document.caretPosition) + keyData + value.substring(document.caretPosition, value.length);
                                document.caretPosition += keyData.toString().length;
                                $(document.keyboardInput).val(value);
                                // undo shift if selected
                                document.keyboardShift = false;
                                updateKeyState(isAlt);

                                if (document.hasValidated) {
                                    $(document.keyboardInput).valid();
                                }
                                document.keyboardInput.setSelectionRange(document.caretPosition, document.caretPosition);
                            }
                        }

                    }
                }
            }
        },
        initFormScrolling = function () {
            $(document).ready(function() {
                $('body').on('focusin', 'input', function() {
                    onInputGainFocus(this);
                });
                $('body').click(function (evt) {
                    var disallow = { "A": 1, "INPUT": 1, "TEXTAREA": 1 };
                    if (!disallow[evt.target.tagName]) {
                        if (!$(evt.target).hasClass('keyboard'))
                            onInputLostFocus();
                    }
                });
                $('body').on('focusin', 'textarea', function () {
                    onInputGainFocus(this);
                });
            });
        },
        initKeyboard = function (sel) {
            if (sel === undefined){
              sel = '.kiosk-keyboard-navbar';
            }
          
            function startup(selector) {
              console.log('init keyboard: ' + selector);
              document.hasValidated = false;
                var navbar = $(selector);
                _keyboardSelector = selector;

                $(selector + " .btn-key").click(function () {
                    onKeyPress(this);
                });
                // // long press:
                $(selector + " .btn-key[data-alt]").mouseup(function(){
                    console.log('long pressing');
                    clearTimeout(pressTimer);
                    return false;
                }).mousedown(function(event){
                    pressTimer = window.setTimeout(function(){
                        event.target.handled = true;
                        $(event.target).addClass('key-held');
                        onKeyPress(event.target,true);
                    },settings.longPressTimer);
                    return false;
                });

                if (settings.showAlways)
                {
                    return;
                }
              
                if (navbar) {
                    $(navbar).hide();
                    $(navbar).slideUp();
                    $(navbar).removeClass('hidden');
                }

                var scrollArea = $(".kiosk-keyboard-scrollarea");
                if (scrollArea) {
                    $(scrollArea).hide();
                    $(scrollArea).removeClass('hidden');
                }
            }
          
            if (settings.autoStart){
              $(document).ready(function(){
                startup(sel);
              })
            }
            else {
            startup(sel);
          }
            
        },
        initCursorTracking = function () {
            document.caretPosition = 0;

            $(document).mousedown(function(){
                if (event.target.tagName == "INPUT" || event.target.tagName == "TEXTAREA") {
                    document.caretPosition = event.target.selectionStart;
                }
            });
            $(document).mouseup(function () {
                if (event.target.tagName == "INPUT" || event.target.tagName == "TEXTAREA") {
                    document.caretPosition = event.target.selectionStart;
                }
            });
        },
        initScanListener = function () {
            $(document).keydown(function (event) {
                if (event.keyCode == 16) {
                    shiftPressed = true;
                }
                else {
                    if (shiftPressed) {
                        shiftPressed = false;
                        if (event.keyCode == 52)
                            scannedCode = scannedCode.concat("$");
                        else if (event.keyCode == 53)
                            scannedCode = scannedCode.concat("%");
                        else if (event.keyCode == 56)
                            scannedCode = scannedCode.concat("*");
                        else if (event.keyCode == 187)
                            scannedCode = scannedCode.concat("+");
                        else
                            scannedCode = scannedCode.concat(String.fromCharCode(event.keyCode));
                    }
                    else {
                        if (event.keyCode == 189)
                            scannedCode = scannedCode.concat("-");
                        else if (event.keyCode == 190)
                            scannedCode = scannedCode.concat(".");
                        else if (event.keyCode == 191)
                            scannedCode = scannedCode.concat("/");
                        else
                            scannedCode = scannedCode.concat(String.fromCharCode(event.keyCode));
                    }
                    setTimeout(function () {
                        $('.kiosk-search-control > input').val(scannedCode);
                        $('.kiosk-search-control > input').closest('form').submit();
                    }, 2500);
                }
            });
        },
        init = function (selector) {
          console.log('starting keyboard:' + selector);
            if (activateKeyboard) {
                initFormScrolling();
                initKeyboard(selector);
                initCursorTracking();
                initScanListener();
            }
        },
        destroy = function(){
          
        };
  
  //init();
    return {
        navigateBack: navigateBack,
        hideEmptyInventory: hideEmptyInventory,
        showKeyboard: showKeyboard,
        startKeyboard: init
    };
}

kiosk = new kiosk();
