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
    ['/layouts/transaction-complete.html','transactionComplete']
    //['/layouts/_keyboard-layout.html','keyboard'],
    //['/layouts/_keyboard-number.html','numeric'],
    //['/layouts/_customer-find-grid.html','customerSearchGrid'],
    //['/layouts/search-overlay.html','searchOverlay']
    
];

for(var i = 0; i < templates.length; i++){
    templateManager.AddTemplate(templates[i][0],templates[i][1]);
}

////// MAIN APP LOGIC ////////

var app = (function(){

    if (false){
        function TEST(){
            customerPhoneLookup('555');
            actionTransactionComplete();
        }
    }
    function startOver(){
        if (typeof TEST === 'function'){
            TEST();
            return;
        }
        templateManager.Render("start","#display");
    }


    var appState = {
        IsAdminMode: false
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

    function customerLookup(){
        templateManager.Render("customerEntry","#display");
    }

    function focusInput(){
        var d = document.querySelectorAll('input[type="text"]');
        for(var i = 0; i < d.length; i++){
            console.log(d[i]);
            d[i].focus();
            break;
        }
    }

    function customerPhoneLookup(code){
        var val = code;
        if (document.keyboardInput){
            val = document.keyboardInput.value;
        }

        var cust = appLink.FindCustomer(val);
        console.log(cust);
        if (cust.IsEmpty){
            validation(document.keyboardInput,'Customer not found!');
            //alert('customer not found. Try again!');
        }
        else {
            startTransaction(cust);
        }
    }

    function customerEmailLookup(code){
        var val = code;
        if (document.keyboardInput){
            val = document.keyboardInput.value;
        }

        var cust = appLink.FindCustomer(null,val);
        if (cust.IsEmpty){
            validation(document.keyboardInput,'Customer not found!');
        }
        else {
            startTransaction(cust);
        }
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

    function getEnterItemModel(){
        var ret = new inputModel();
        ret.Caption = "Enter Item Number";
        ret.OnCancel = "app.action_ResumeTransaction()";
        ret.OnSubmit = "app.action_EnterItemSubmit()";
        return ret;
    }

    function getAppState(){
        return appState;
    }

    function validation(input,message){
        var t = $(input).closest('.user-input-wrap');
        t.addClass('validation');
        t.prepend('<span class="validation-message">' + message + '</span>');
        input.valueChanged = function(){
            clearValidation(this);
        };
    }
    function clearValidation(input){
        var t = $(input).closest('.user-input-wrap');
        t.removeClass('validation');
        t.find('.validation-message').remove();
        input.valueChanged = null;
    }

    function actionEnterItem(){
        templateManager.Render('numericPad','.right-content',getEnterItemModel());
    }
    function actionEnterItemSubmit(){
        alert('not implemented');
    }
    function actionRedeemGiftCard(){
        var m = new inputModel();
        m.Caption = "Scan your giftcard";
        m.OnCancel = "app.action_ResumeTransaction()";

        templateManager.Render('giftCard','.right-content', m);
    }
    function actionAddCoupon(){
        var m = new inputModel();
        m.Caption = "Enter Coupon Code";
        m.OnSubmit = "app.actionAddCouponSubmit()",
        m.OnCancel = "app.action_ResumeTransaction(true)";

        templateManager.Render('fullText','#display',m);
    }
    function actionAddCouponSubmit(){

    }
    function actionFinishAndPay(){
        templateManager.Render('finishAndPay','#display');
    }
    function actionUnlinkAccount(){
        alert('not implemented');
    }
    function actionHelpShow(){
        templateManager.Render('helpScreen','#display');
    }
    function actionHelpCancel(){
        startTransaction(appLink.CurrentCustomer());
    }
    function actionAddCredit(){
        alert('not implemented');
    }
    function actionTransactionComplete(){
        var m = new inputModel();
        m.OnSubmit = "app.action_PrintReceipt(true)";
        m.OnCancel = "app.action_PrintReceipt(false)";
        templateManager.Render('transactionComplete','#display',m);
    }

    function actionPrintReceipt(yes){
        if (yes){
            // appLink print receipt
            alert('Printing Receipt... PLACEHOLDER!');
            // callback for "OnDonePrinting"
            startOver();
            return;
        }

        startOver();
    }

    function resumeTransaction(fromFullScreen) {
        if (fromFullScreen){
            startTransaction(appLink.CurrentCustomer());
        }
        else {
            resetTransactionRight();
        }
    }

    return {
        startOver: startOver,
        customerLookup: customerLookup,
        action_EnterItem: actionEnterItem,
        action_EnterItemSubmit: actionEnterItemSubmit,
        action_RedeemGiftCard: actionRedeemGiftCard,
        action_AddCoupon: actionAddCoupon,
        action_AddCouponSubmit: actionAddCouponSubmit,
        action_AddCredit: actionAddCredit,
        action_ResumeTransaction: resumeTransaction,
        action_FinishAndPay: actionFinishAndPay,
        action_UnlinkAccount: actionUnlinkAccount,
        action_HelpShow: actionHelpShow,
        action_HelpCancel: actionHelpCancel,
        action_TransactionComplete: actionTransactionComplete,
        action_PrintReceipt: actionPrintReceipt,
        customerPhoneLookup: customerPhoneLookup,
        customerEmailLookup: customerEmailLookup,
        

    }
})();

app.startOver();
