var templateManager = (function(){
    console.log('manager');
    var templateList = [];

    Handlebars.registerHelper('eq',function(prop, val){
        return prop == val;
    })

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
    ['/layouts/start.html','start'],
    ['/layouts/scan-layout.html','scan'],
    ['/layouts/_customer-set.html','customerEntry'],
    ['/layouts/_full-numeric.html','fullNumeric'],
    ['/layouts/_full-text.html','fullText'],
    ['/layouts/_item-list.html','itemList'],
    ['/layouts/_item-totals.html','itemTotal'],
    ['/layouts/_transaction-right.html','tran-right'],
    ['/layouts/_numeric-small.html','numericPad'],
    ['/layouts/help.html','helpScreen'],
    ['/layouts/_gift-card-scan.html','giftCard'],
    ['/layouts/pay-pinpad.html','finishAndPay'],
    ['/layouts/transaction-complete.html','transactionComplete'],
    ['/layouts/_admin-options.html','admin-panel'],
    ['/layouts/_admin-price-override.html','admin-priceOverride'],
    ['/layouts/_footer.html','footer']
    //['/layouts/_keyboard-layout.html','keyboard'],
    //['/layouts/_keyboard-number.html','numeric'],
    //['/layouts/_customer-find-grid.html','customerSearchGrid'],
    //['/layouts/search-overlay.html','searchOverlay']
    
];

for(var i = 0; i < templates.length; i++){
    templateManager.AddTemplate(templates[i][0],templates[i][1]);
}