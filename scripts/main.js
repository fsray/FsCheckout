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
    ['/layouts/start.html','start'],
    ['/layouts/scan-layout.html','scan'],
    ['/layouts/_keyboard-layout.html','keyboard'],
    ['/layouts/_keyboard-number.html','numeric'],
    ['/layouts/_full-width-pin.html','customerPhone'],
    ['/layouts/_item-list.html','itemList'],
    ['/layouts/_item-totals.html','itemTotal'],
    ['/layouts/_transaction-right.html','tran-right'],
    ['/layouts/_enter-item.html','enterItem'],
    ['/layouts/_customer-find-grid.html','customerSearchGrid'],
    ['/layouts/search-overlay.html','searchOverlay']
    
];

for(var i = 0; i < templates.length; i++){
    templateManager.AddTemplate(templates[i][0],templates[i][1]);
}

////// MAIN APP LOGIC ////////

var app = (function(){

    if (false){
        function TEST(){
            customerLookupPhone('555');
        }
    }
    function startOver(){
        if (typeof TEST === 'function'){
            TEST();
            return;
        }
        templateManager.Render("start","#display");
    }

    function startTransaction(customer){
        templateManager.Render("scan","#display",customer);
        resetTransactionRight();
        updateTransaction();
    }

    function resetTransactionRight(){
        templateManager.Render("tran-right",'.right-content',appLink.CurrentCustomer())
    }
    
    function addCustomerToTransaction(customer){
        // TODO: update the Credit, other things?
    }
    
    function updateTransaction(){
        // dependent on the Scan template
        templateManager.Render("itemList",".item-container",appLink.GetTransactionItems());
        templateManager.Render("itemTotal",".totals",appLink.GetTotals());
    }

    function enterPhone(){
        templateManager.Render("customerPhone","#display");
        kiosk.startKeyboard('.keyboard-wrapper');
    }

    function focusInput(){
        var d = document.querySelectorAll('input[type="text"]');
        for(var i = 0; i < d.length; i++){
            console.log(d[i]);
            d[i].focus();
            break;
        }
    }

    function customerLookupPhone(code){
        var val = code;
        if (document.keyboardInput){
            val = document.keyboardInput.value;
        }

        var cust = appLink.FindCustomer(val);
        console.log(cust);
        if (cust.IsEmpty){
            alert('customer not found. Try again!');
        }
        else {
            startTransaction(cust);
        }

    }

    function showEnterItem(){
        templateManager.Render('enterItem','.right-content');
        kiosk.startKeyboard('.keyboard-wrapper');
    }

    function itemNumberFind(){
        var val = document.keyboardInput.value;
        var item = appLink.FindItem(val);
        if (item != null){
            appLink.AddItemToTransaction(item);
            resetTransactionRight();
            updateTransaction();
        }
        else {
            alert('item not found');
        }
    }

    return {
        startTransaction: startOver,
        customerPhone: enterPhone,
        customerLookupPhone: customerLookupPhone,
        showEnterItem: showEnterItem,
        exitEnterItem: resetTransactionRight,
        enterItemNumber: itemNumberFind

    }
})();

app.startTransaction();
