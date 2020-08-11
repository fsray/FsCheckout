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
    if (window.external.templateLoader !== undefined){
        loadTemplate = function(path,name){
            console.log('OVERRIDE',path,name);
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
    ['handlebars-template/keyboard-layout.html','keyboard'],
];

for(var i = 0; i < templates.length; i++){
    templateManager.AddTemplate(templates[i][0],templates[i][1]);
}