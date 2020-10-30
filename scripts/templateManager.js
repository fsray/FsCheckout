var templateManager = (function(){
    console.log('manager');
    var templateList = [];
    var localeStrings = {};

    Handlebars.registerHelper('eq',function(prop, val){
        return prop == val;
    })

    async function addTemplate(path,name){
        var exists = findTemplate(path,name);

        if (exists == null){
            await loadTemplate(path,name);
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

    async function loadClientResources() {
        return new Promise(function(resolve,reject){
            var req = new XMLHttpRequest();
            req.overrideMimeType = "application/json";
            req.open('GET','/scripts/LocaleStrings.json',true);
            req.onload = function(){
                var response = req.response;
                resolve(response);
            };
            req.onerror = function(){
                reject({
                    status:this.status,
                    statusText: xhr.statusText
                });
            };

            req.send();
        })
    }

    async function templateLoader(path,name){
        return new Promise(function(resolve,reject){
            var xhr = new XMLHttpRequest();
            xhr.addEventListener('load',function(){
                resolve(this.responseText);
                //templateList.push(new template(path,this.responseText,name));
            });
            xhr.open("GET",path,true); // intentionall synchronous
            xhr.send();
        })
    }

    var loadTemplate = async function(path,name){

        await templateLoader(path,name).then(function(result){
            if (result != null){
                result = applyLocaleStrings(result,localeStrings);
                templateList.push(new template(path,result,name));
            }
        })
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
        return new Promise((resolve,error)=>{
            var t = getTemplateByName(name);
            if (t != null && t.Template != null){
                var temp = t.Template(data);
                $(selector).html(temp);
                addListeners(selector,data);
            }
            resolve(true);
        });
    }

    function addListeners(temp,data){
        var all = $(temp).find('[data-action]');
        var actions = parseActions(data);
        for(var i = 0; i < all.length; i++){
            var k = all[i].getAttribute('data-action');
            for(var j = 0; j < actions.length; j++){
                if (actions[j].ActionName === k){
                    all[i].addEventListener('click',actions[j].Action);
                    all[i].addEventListener('click',function(){
                        actionListener.ActionHappened(actionListener.ACTION_TYPE.BUTTON_CLICK);
                    })
                }
            }
        }
    }

    function parseActions(data){
        var actions = [];

        function recurse(o,l){
            for(var prop in o){
                if (prop === 'ActionName'){
                    l.push(o);
                }
                if (typeof o[prop] === 'object'){
                    recurse(o[prop],l);
                }
            }
        }

        recurse(data,actions);
        
        return actions;
    }

    // for c# Window.External override
    if (typeof FieldStack === 'object'){
        templateLoader = async function(path,name){
            return FieldStack.templateLoader(path,name);
        }

        loadClientResources = async function(){
            return FieldStack.templateLoader('/scripts/LocaleStrings.json','_resources');
        }
    }

    (async function(){
        await loadClientResources().then(obj=>{
            localeStrings = JSON.parse(obj);
        });

        console.log(localeStrings);
    })();

    function applyLocaleStrings(template,locales){
        for(var prop in locales){
            template = template.split('[' + prop + ']').join(locales[prop]);
        }

        return template;
    }

    async function loadTemplates(list){
        return new Promise(async function(resolve,reject){
            for(var i = 0; i < list.length; i++){
                await addTemplate(templates[i][0],templates[i][1]);
            }
            resolve(true);
        });
    }
    
    function findClientResource(name, def){
        if (name == null){
            return def;
        }

        for(var prop in localeStrings){
            if (prop.toLowerCase() === name.toLowerCase()){
                return localeStrings[prop];
            }
        }

        return def;
    }

    return {
        AddTemplate: addTemplate,
        FindTemplate: findTemplate,
        GetTemplate: getTemplateByName, // search by name
        Render: renderTemplate, // name, selector, json data
        Init: loadTemplates, // load all the templates!
        GetLocaleString: findClientResource
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
