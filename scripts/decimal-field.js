class decimalField extends HTMLElement {
  
    constructor(...args){
      super(...args);
      
      this.SEP_CHAR = '.';
      this.backer = [];
      
      let shadow = this.attachShadow({mode:'closed'});
      let i1 = document.createElement('span');
      i1.setAttribute('mode',0);
      i1.className = "input integer";
      shadow.appendChild(i1);
      this.backer.push(i1);
      
      let sep = document.createElement('span');
      sep.className = 'input separator';
      sep.innerHTML = this.SEP_CHAR;
      shadow.appendChild(sep);
      
      let i2 = document.createElement('span');
      i2.className = "input decimal";
      i2.setAttribute('mode',1);
      shadow.appendChild(i2);
      this.backer.push(i2);
      
      i2.setMode = this.setMode;
      i1.setMode = this.setMode;
      
      this.backer_input = this.getBackerDefault();

      this.prefix_char = '';
      this.append_char = '';

      

      this._target = 0;
    }
    
    getBackerDefault() {
      return [['0'],['0','0']];
    }
    
    connectedCallback() {
      let self = this;
      this.backer[0].addEventListener('click',function(){
        self.setMode(0,this);
      })
      this.backer[1].addEventListener('click',function(){
        self.setMode(1,this);
      })
      this.setMode(0,this.backer[0]);
      this.doRender();

      console.log(this);
      if (this.hasAttribute('prefix')){
        this.prefix_char = this.getAttribute('prefix');
        if (this.prefix_char === 'undefined'){
            this.prefix_char = '';
        }
      }
      if (this.hasAttribute('append')){
          this.append_char = this.getAttribute('append');
          console.log(this.append_char);
          if (this.append_char === 'undefined'){
              this.append_char = '';
          }
      }

      console.log('CONNECTED');
    }
    
    
    setMode(m,targ) {
      this._target = parseInt(m);
      this.backer[0].className = this.backer[0].className.replace('_selected','');
      this.backer[1].className = this.backer[1].className.replace('_selected','');
      
      targ.className += ' _selected';
    }
    getMode() {
      return this._target;
    }
    
    // external
    addCharacter(c){
      if (this._target === 1){
        // adding this character to the decimal field
        let current = this.backer_input[1];
        current.push(c);
        this.backer_input[1] = this.roundDecimal(current);
      }
      else {
        // default to int field
        let current = this.backer_input[0];
        if (current.length === 1 && current[0] === '0'){
            current.pop();
        }
        current.push(c);
        this.backer_input[0] = current;
      }
      
      this.doRender();
    }
    
    clearValue(){
      this.backer_input = this.getBackerDefault();
      this.setMode(0,this.backer[0]);
      this.doRender();
    }
    
    toggleMode() {
        if (this._target === 0){
            this.setMode(1,this.backer[1]);
        }
        else {
            this.setMode(0, this.backer[0]);
        }
    }
    
    get value() {

        var ret = this.prefix_char + this.backer_input[0].join('') + this.SEP_CHAR + this.backer_input[1].join('') + this.append_char;
        console.log(ret);
        return ret;
    }
    set value(v){
      
      let start = this.getBackerDefault();
      
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
      
      this.backer_input[0] = int;
      this.backer_input[1] = this.roundDecimal(dec);
      
      this.doRender();
    }
    
    // helper
    roundDecimal(x){
      x = x.splice(x.length - 2);
      while(x.length < 2){
        x.push('0');
      }
      return x;
    }
    
    // push the backer_input values into the view
    doRender(){
      this.backer[0].innerHTML = this.prefix_char + this.backer_input[0].join('');
      this.backer[1].innerHTML = this.backer_input[1].join('') + this.append_char;
    }
    
    
    
  }
  
  customElements.define('decimal-field',decimalField);