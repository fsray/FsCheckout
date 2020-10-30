var idleTimer  = (function(){

    var idleTimer; // intervalHolder
    var intervalLength;
    const IDLE_ACTION_NAME = 'IDLE_ACTION';

    var timer_mode = {
        "RECEIPT_CHOSEN": 0,
        "RECEIPT_UNKNOWN":1,
        "TRANSACTION_IDLE":2
    }

    // null will clear the interval
    function setTimerAction(timerMode, callback){
        if (timerMode === null || timerMode === undefined){
            clearInterval(idleTimer);
            return;
        }

        intervalLength = 900000; // default 15 minutes
        var temp;

        switch(timerMode){
            case timer_mode.RECEIPT_CHOSEN:
                temp = templateManager.GetLocaleString("Setting.FinalizeTimer.ReceiptChosen");
                break;
            case timer_mode.RECEIPT_UNKNOWN:
                temp = templateManager.GetLocaleString("Setting.FinalizeTimer.ReceiptUnknown");
                break;
            default:
                temp = templateManager.GetLocaleString("Setting.FinalizeTimer.Idle");
                break;
        }

        if (temp != null && !isNaN(parseInt(temp))){
            intervalLength = temp;
        }

        console.log('SETTING RESET TIMER',intervalLength);

        actionListener.EventRegister(IDLE_ACTION_NAME,callback);

        set_idle_action();

    }

    function set_idle_action(){
        // clear the current timer
        clearInterval(idleTimer);

        // set up the next timer
        idleTimer = setInterval(function(){
            clearInterval(idleTimer);
            actionListener.EventTrigger(IDLE_ACTION_NAME);
        },intervalLength);

    }

    // resets the current interval to start over
    function resetCurrentTimer() {
        set_idle_action();
    }


    return {
        TimerMode: timer_mode,
        SetTimer: setTimerAction,
        ResetTimer: resetCurrentTimer
    }

})();


var actionListener = (function(){

    var ACTIONS = {
        "KEY_PRESS":0,
        "SCAN_HAPPENED":1,
        "BUTTON_CLICK":2
    }

    var event_register = [];

    function event_handler(name, action) {
        this.EventName = name;
        this.EventAction = action;
    }

    function action_register(ev){
        // on any event, reset the idle timer
        console.log('captured action:',ev);
        idleTimer.ResetTimer();
    }

    function eventRegister(name,action){
        var handler = new event_handler(name,action);
        var set = false;
        for(var i = 0; i < event_register.length; i++){
            if (event_register[i].EventName === name){
                event_register[i] = handler;
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
                if (typeof event_register[i].EventAction === 'function'){
                    console.log('EVENT TRIGGERED',name);
                    event_register[i].EventAction();
                    return;
                }
                else {
                    event_register.splice(i,1); // 'unregister' the trigger
                }
            }
        }
    }

    return {
        ACTION_TYPE: ACTIONS,
        ActionHappened: action_register,
        EventRegister: eventRegister,
        EventTrigger: eventTrigger
    }
    
})()