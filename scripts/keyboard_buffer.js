/* script for generating and monitoring keyboard (scanner) input */

var keyboard_buffer = (function(){

  var _buffer = null;

  function generateKeyboard(){
    var exists = document.getElementById('input-buffer');
    if (exists){
      _buffer = exists;
      return;
    }

    var k = document.createElement('input');
    k.id = 'input-buffer';
    k.type = "text";
    k.hello = "world";
    k.style.position = "absolute";
    k.style.top = "-1000px";
    k.style.left = "-1000px";
    k.addEventListener('keyup',handleBufferInput);
    k.addEventListener('blur',setBufferFocus);

    document.body.appendChild(k);
    _buffer = k;
  }

    function setBufferFocus(){
      console.log('refocusing');
      _buffer.focus();
    }
    function handleBufferInput(){
      var el = this;
      if (el == null){
        return;
      }
      if (event){
        if (event.key === "Enter"){
          app.Background_ScanHandle(el.value);
          
          // actionListener.ActionHappened(actionListener.ACTION_TYPE.SCAN_HAPPENED);
          actionListener.EventTrigger(actionListener.ACTION_TYPE.SCAN_HAPPENED);

          keyboard_monitor(el.value);
          el.value = '';
        }
      }
    }

    function keyboard_monitor(value){
      // TODO: DEV // just for monitoring scanner data
      $('#background-buffer').html(value);
    }

    generateKeyboard();
    setBufferFocus();

    return {
      Start: generateKeyboard
    }

})();