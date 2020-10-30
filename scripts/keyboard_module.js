
/*
$(document).bind("contextmenu", function(e) {
        e.preventDefault();
    });
*/

function numeric_helper(isDecimal, maxValue, prefix, append) {
    
    // helper to flip 'undefined' values
    this._fixUndefined = function(v,def){
      if (def === undefined){
        def = ''
      }
      
      if (v === undefined || v === null){
        return def;
      }
      
      return v;
    }
  
    // IS_DECIMAL: allow editing INT and DECIMAL
    this.IS_DECIMAL = this._fixUndefined(isDecimal,true);
    // don't allow INT to go above this value
    this.MAX_VALUE = this._fixUndefined(maxValue,null);
      
    // helper to set default array
    this._getBackerDefault = function() {
        return [['0'],['0','0']];
    }
    
    // holds the current 'values' broken into array
    this.backer = this._getBackerDefault();
    // separate INT from DECIMAL (visual)
    this.SEP_CHAR = '.';

    // for MONEY (visual)
    this.PREFIX = this._fixUndefined(prefix);
    // for PERCENT (visual)
    this.APPEND = this._fixUndefined(append);
  
    // INT or DECIMAL for AddCharacter
    this.TARGET = 0;

    // flip to editing INT or DECIMAL for AddCharacter
    this.setTarget = function(m) {
      if (!this.IS_DECIMAL){
          // always stay in INT mode
          this.TARGET = 0;
      }
      else {
        this.TARGET = parseInt(m);
      }
    }

    // targeting INT or DECIMAL?
    this.getTarget = function() {
        return this.TARGET;
    }

    // Only allow 2 characters in DECIMAL field
    this.roundDecimal = function(x){
        x = x.splice(x.length - 2);
        while(x.length < 2){
            x.push('0');
        }
        return x;
    }

    // PUBLIC:

    // add a character to backer
    this.AddCharacter = function(c){
        // the DECIMAL section
        if (this.TARGET === 1){
            let current = this.backer[1];
            current.push(c);
            this.backer[1] = this.roundDecimal(current);
        }
        else {
          // the INT section
            let current = this.backer[0];
            if (current.length === 1 && current[0] === '0'){
                current.pop();
            }
            current.push(c);
          
            // TODO: compare to MaxValue
            if (this.MAX_VALUE != null){
              let max = Array.from(this.MAX_VALUE.toString());
              if (current.length > max.length){
                current = max;
              }
              else {
                try {
                  let currValue = parseInt(current.join(''));
                  let maxValue = parseInt(max.join(''));
                  if (currValue > maxValue){
                    current = max;
                  }
                }
                catch {
                  current = max;
                }
              }
            }
          
            this.backer[0] = current;
        }
    }

    this.ClearValue = function() {
        this.backer = this._getBackerDefault();
        this.setTarget(0);
    }

    this.GetValue = function(){
        var ret =
            this.PREFIX 
            + this.backer[0].join('') 
            + (this.IS_DECIMAL ? 
                this.SEP_CHAR 
                + this.backer[1].join('')
                : '')
            + this.APPEND;

        return ret;
    }

    this.SetValue = function(v){
      let start = this._getBackerDefault();
      
      let x = v.indexOf('.');
      
      let int = start[0];
      let dec = start[1];
      
      if (x > -1){
        int = Array.from(v.substring(0,x));
        dec = Array.from(v.substring(x+1));
      }
      else {
        int = Array.from(v);
      }
      
      this.backer[0] = int;
      this.backer[1] = this.roundDecimal(dec);
      
    }

    this.ToggleMode = function() {
        if (this.TARGET === 0){
            this.setTarget(1);
        }
        else {
            this.setTarget(0);
        }
    }
}


// KEYBOARD functionality:
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
            if (ctrl) {
              if (ctrl.id === 'input-buffer'){
                return;
              }
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

                if (document.keyboardInput != null && document.keyboardInput.DECI_HELPER === undefined){
                    if (document.keyboardInput.hasAttribute('money')){
                        document.keyboardInput.DECI_HELPER = new numeric_helper(true,null,'$','');
                    }
                    else if (document.keyboardInput.hasAttribute('percent')){
                        document.keyboardInput.DECI_HELPER = new numeric_helper(false,100,'','%');
                    }
                    else if (document.keyboardInput.hasAttribute('number')){
                        document.keyboardInput.DECI_HELPER = new numeric_helper(false,null,'','');
                    }
                    
                    if (document.keyboardInput.DECI_HELPER !== undefined){
                        $(document.keyboardInput).val(document.keyboardInput.DECI_HELPER.GetValue());
                    }
                }
              }
            }
            
            //console.log("keyboard input: " + document.keyboardInput.name);
        },
        onInputLostFocus = function (ctrl) {
            //console.log("lost focus: " + ctrl);

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
            //console.log('updateKeyState');
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
                
                actionListener.ActionHappened(actionListener.ACTION_TYPE.KEY_PRESS);

                if (!$(key).hasClass('disabled')) {
                    var keyData = $(key).data('key');
                    var deciHelper = null;
                    if (document.keyboardInput != null && document.keyboardInput.DECI_HELPER !== undefined){
                        deciHelper = document.keyboardInput.DECI_HELPER;
                    }

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
                        if (keyData === 'dot'){
                            if (deciHelper){
                                deciHelper.ToggleMode();
                                return;
                            }
                        }
                        
                        var value = $(document.keyboardInput).val();
                        if (typeof document.keyboardInput.valueChanged === 'function'){
                            document.keyboardInput.valueChanged();
                        }
                        
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
                                if (deciHelper != null){
                                    deciHelper.ClearValue();
                                    $(document.keyboardInput).val(deciHelper.GetValue());
                                }
                                else {
                                    kiosk.clearKeyboard();
                                }
                                return;
                            }

                            // all other keys
                        if (document.keyboardInput) {
                            if (keyData === 'enter') {
                                // $(document.keyboardInput).closest('form').validate();
                                // document.hasValidated = true;
                                // $(document.keyboardInput).closest('form').submit();
                            } else {
                                if ((document.keyboardCaps || document.keyboardShift) && keyData != null) {
                                    keyData = keyData.toString().toUpperCase();
                                }
                                if (deciHelper != null){
                                    console.log('HERE I AM',deciHelper);
                                    deciHelper.AddCharacter(keyData.toString());
                                    $(document.keyboardInput).val(deciHelper.GetValue());
                                }
                                else {
                                    value = value.substring(0, document.caretPosition) + keyData + value.substring(document.caretPosition, value.length);
                                    document.caretPosition += keyData.toString().length;
                                    $(document.keyboardInput).val(value);
                                }
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
                mainFocus();
            }
        },
        mainFocus = function(){
            var j = document.getElementsByClassName('user-input');
            for(var i = 0; i < j.length; i++){
                onInputGainFocus(j[i]);
                break;
            }
        },
        clearInput = function(){
            $(document.keyboardInput).val('');
            document.keyboardInput.setSelectionRange(0,0);
            return;
        },
        destroy = function(){
          
        };
  
  //init();
    return {
        navigateBack: navigateBack,
        hideEmptyInventory: hideEmptyInventory,
        showKeyboard: showKeyboard,
        startKeyboard: init,
        clearKeyboard: clearInput
    };
}

kiosk = new kiosk();


