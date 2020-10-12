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
    k.style = "position:absolute; top:-1000px; left:-1000px";
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
          keyboard_monitor(el.value);
          el.value = '';
        }
      }
    }

    function keyboard_monitor(value){
      $('#background-buffer').html(value);
      if (value === "admin"){
        app.action_AdminModeEnter();
      }
    }

    generateKeyboard();
    setBufferFocus();

    return {
      Start: generateKeyboard
    }

})();