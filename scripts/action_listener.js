var idleTimer  = (function(){
  
    const IDLE_ACTION_NAME = 'IDLE_ACTION';
    var _timer = new timer_base(IDLE_ACTION_NAME);
  
    var timer_mode = {
        "RECEIPT_CHOSEN": 0,
        "RECEIPT_UNKNOWN":1,
        "TRANSACTION_IDLE":2
    }

    // null will clear the interval
    function setTimerAction(timerMode, callback, callbackName){
        if (timerMode === null || timerMode === undefined){
            _timer.Stop();
            return;
        }

        var intervalLength = 900000; // default 15 minutes
        var temp;

        switch(timerMode){
            case timer_mode.RECEIPT_CHOSEN:
                temp = templateManager.GetLocaleString("Setting.FinalizeTimer.ReceiptChosenSeconds");
                break;
            case timer_mode.RECEIPT_UNKNOWN:
                temp = templateManager.GetLocaleString("Setting.FinalizeTimer.ReceiptUnknownSeconds");
                break;
            default:
                temp = templateManager.GetLocaleString("Setting.FinalizeTimer.IdleSeconds");
                break;
        }

        if (temp != null && !isNaN(parseInt(temp))){
            intervalLength = temp * 1000;
        }

        // TODO DEBUG
        //intervalLength = 5000;

        console.log('SETTING RESET TIMER',intervalLength);

        _timer.SetAction(intervalLength, callback, callbackName);

    }

    // resets the current interval to start over
    function resetCurrentTimer() {
        _timer.ResetCurrentAction();
    }

    function disableTimer(){
        _timer.Stop();
    }


    return {
        TimerMode: timer_mode,
        SetTimer: setTimerAction,
        ResetTimer: resetCurrentTimer,
        DisableTimer: disableTimer
    }

})();


function timer_base(name){
  var TIMER_NAME = name;

  var intervalLength = null;
  var idleTimer = null;

  function setTimerAction(interval, callback, actionName){
      intervalLength = interval;

      actionListener.EventRegister(TIMER_NAME,callback, actionName);

      set_timer_action();
  }

  function set_timer_action(){
      clearInterval(idleTimer);

      let timerName = TIMER_NAME;

      // set up the next timer
        idleTimer = setInterval(function(){
            clearInterval(idleTimer);
            actionListener.EventTrigger(timerName);
        },intervalLength);
  }

  function resetCurrentAction(){
      set_timer_action();
  }

  function clearSelf() {
    // clear the interval
    clearInterval(idleTimer);
    // NULL the register name
    actionListener.EventClear(this.TIMER_NAME);
  }

  function stopSelf() {
    clearInterval(idleTimer);
  }

  return {
    SetAction: setTimerAction,
    ResetCurrentAction: resetCurrentAction,
    Stop: stopSelf,
    Void: clearSelf
  }
}

var actionListener = (function(){

    var ACTIONS = {
        "KEY_PRESS":"KEY_PRESS",
        "SCAN_HAPPENED":"SCAN_HAPPENED",
        "BUTTON_CLICK":"BUTTON_CLICK"
    }

    var event_register = [];

    function event_handler(name, action, actionName) {
        this.EventName = name;
        this.EventActions = [];
        this.EventActionName = actionName;
        this.EventActions.push(action);
    }

    (function(){
        // doing the registration for these right here... 
        eventRegister(ACTIONS.KEY_PRESS,function(){
            action_register(ACTIONS.KEY_PRESS);
        });
        eventRegister(ACTIONS.SCAN_HAPPENED,function(){
            action_register(ACTIONS.SCAN_HAPPENED);
        });
        eventRegister(ACTIONS.BUTTON_CLICK,function(){
            action_register(ACTIONS.BUTTON_CLICK);
        });

    })()

    function action_register(ev){
        // on any event, reset the idle timer
        console.log('captured action:',ev);
        idleTimer.ResetTimer();
    }

    function eventRegister(name,action, actionName){
        var handler = new event_handler(name,action, actionName);
        var set = false;
        for(var i = 0; i < event_register.length; i++){
            if (event_register[i].EventName === name){
                if (actionName){
                    if (event_register[i].EventActionName === actionName){
                        continue;
                    }
                }
                event_register[i].EventActions.push(action);
                set = true;
                break;
            }
        } 

        if (!set){
            console.log('EVENT REGISTERED:',name);
            event_register.push(handler);
        }
    }

    function eventTrigger(name){
        for(var i = 0; i < event_register.length; i++){
            if (event_register[i].EventName === name){
                for(var j = 0; j < event_register[i].EventActions.length; j++){
                    if (typeof event_register[i].EventActions[j] === 'function'){
                        event_register[i].EventActions[j]();
                        continue;
                    }
                }
                return;
            }
        }
    }

    function eventClear(name){
        for(var i = 0; i < event_register.length; i++){
            if (event_register[i].EventName === name){
                event_register.splice(i,1);
                return;
            }
        }
    }

    return {
        ACTION_TYPE: ACTIONS,
        ActionHappened: action_register,
        EventRegister: eventRegister,
        EventTrigger: eventTrigger,
        EventClear: eventClear
    }
    
})()


var sounder = (function() {
    var ctx = new AudioContext();
    var gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.value = 1;

    function playTone(freq){
        console.log('TONE');
        gain.gain.value = 1;
        let osc = ctx.createOscillator();
        osc.connect(gain);
        osc.frequency.value = freq;

        osc.start();
        gain.gain.setTargetAtTime(0,ctx.currentTime,.02);
        setTimeout(function(){
            osc.stop();

        },100); // just long enough for the decay to occur
    }

    (function(){
        actionListener.EventRegister(actionListener.ACTION_TYPE.BUTTON_CLICK, function(){
            sounder.Play(300);
        })
        actionListener.EventRegister(actionListener.ACTION_TYPE.KEY_PRESS, function(){
            sounder.Play(800);
        })
    })()

    return {
        Play: playTone
    }

})()