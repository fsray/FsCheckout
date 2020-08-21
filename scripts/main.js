var templateManager = (function(){

    var templateList = [];


    function addTemplate(path,name){
        var exists = findTemplate(path,name);

        if (exists == null){
            loadTemplate(path,name);
        }
    }

    function getTemplateByName(name){
        return findTemplate(null,name);
    }
    function findTemplate(path,name){
        for(var i = 0; i < templateList.length; i++){
            if (templateList[i].Path === path){
                return templateList[i];
            }
            if (templateList[i].Name === name){
                return templateList[i];
            }
        }
    }

    var loadTemplate = function(path,name){
        var xhr = new XMLHttpRequest();
        xhr.addEventListener('load',function(){
            templateList.push(new template(path,this.responseText,name));
        });
        xhr.open("GET",path,false); // intentionall synchronous
        xhr.send();

    }

    // template object
    function template(path,source,name){
        return {
            Path:path,
            Source:source,
            Name:name,
            Template:Handlebars.compile(source)
        }
    }

    function renderTemplate(name,selector,data){
        var t = getTemplateByName(name);
        if (t != null && t.Template != null){
            $(selector).html(t.Template(data));
        }
    }

    // for c# Window.External override
    if (typeof window.external.templateLoader !== "undefined" 
    && window.location.protocol !== "http:"){
        loadTemplate = function(path,name){
            var r = window.external.templateLoader(path,name);
            if (r != null){
                templateList.push(new template(path,r,name));
            }
        }
    }


    return {
        AddTemplate: addTemplate,
        FindTemplate: findTemplate,
        GetTemplate: getTemplateByName, // search by name
        Render: renderTemplate // name, selector, json data
    }
})()

// list of template ['path','name']
var templates = [
    ['handlebars-template/start.html','start'],
    ['handlebars-template/keyboard-layout.html','keyboard'],
    ['handlebars-template/help.html','help-page'],
    ['handlebars-template/pin-pad.html','pin-pad'],
    ['handlebars-template/scan.html','scan'],
    ['handlebars-template/thank-you.html','thank-you'],
    ['handlebars-template/scan-layout.html','scan2'],
    ['handlebars-template/item-list.html','item-list'],
    
];

for(var i = 0; i < templates.length; i++){
    templateManager.AddTemplate(templates[i][0],templates[i][1]);
}

if (true){
  // create a dropdown for easily flipping between views... for fun!
  var l = document.createElement('select');
  l.onchange = function(){
    console.log(this.value);
    for(var t = 0; t < templates.length; t++){
      if (templates[t][0] === this.value){
        templateManager.Render(templates[t][1],'#display',null);
      }
    }
  }
  for(var i = 0; i < templates.length; i++){
    var o = document.createElement('option');
    o.innerText = templates[i][1]; // name
    o.value = templates[i][0];
    l.appendChild(o);
    
  }

var w = document.getElementById('testing-bar');
if (w != null){
  w.insertBefore(l,w.firstChild);
}

  $(document).ready(function(){
    templateManager.Render('scan2','#display');
  })
}