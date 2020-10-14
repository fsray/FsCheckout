////// MAIN APP LOGIC ////////
var app = (function(){

    if (false){
        function TEST(){
            customerPhoneLookup('555');
            adminModeEnter();
            updateTransaction();
        }
    }
    function startOver(){
        if (typeof TEST === 'function'){
            TEST();
            return;
        }
        console.log('start over');
        
        templateManager.Render("start","#display", action('customer-lookup',customerLookup));
    }


    var appState = {
        IsAdminMode: true
    }

    function startTransaction(customer){
        templateManager.Render("scan","#display",customer);
        resetTransactionRight();
        updateTransaction();
    }

    function resetTransactionRight(){
        var m = appLink.CurrentCustomer();
        m.actions = [
            action("action_enterItem",actionEnterItem),
            action("action_redeemGiftCard",actionRedeemGiftCard),
            action("action_addCredit",actionAddCredit),
            action("action_addCoupon",actionAddCoupon),
            action("finish_pay",actionFinishAndPay)
        ]

        templateManager.Render("tran-right",'.right-content',m)
    }
    
    function addCustomerToTransaction(customer){
        // TODO: update the Credit, other things?
    }
    
    function updateTransaction(){
        // dependent on the Scan template
        var items = appLink.GetTransactionItems();
        items.actions = [
            action("row_select",adminRowSelect),
            action("item_remove",function(){

            }),
            action("item_prompt",function(){
                event.cancelBubble = true;
                console.log('prompt',event);
            })
        ]
        templateManager.Render("itemList",".item-container",items);
        templateManager.Render("itemTotal",".totals",appLink.GetTotals());
        templateManager.Render('footer','.footer',getFooterModel())
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
        var m = new inputModel();
        m.Caption = "Enter Item Number";
        m.OnCancel = action("action_resumeTransaction",resumeTransaction);
        m.OnSubmit = action("action_enterItemSubmit",actionEnterItemSubmit);

        templateManager.Render('numericPad','.right-content',m);
    }
    function actionEnterItemSubmit(){
        alert('not implemented');
    }
    function actionRedeemGiftCard(){
        var m = new inputModel();
        m.Caption = "Scan your giftcard";
        m.OnCancel = action("action_resumeTransaction",resumeTransaction);

        templateManager.Render('giftCard','.right-content', m);
    }
    function actionAddCoupon(){
        var m = new inputModel();
        m.Caption = "Enter Coupon Code";
        m.OnSubmit = action("action_addCouponSubmit",actionAddCouponSubmit),
        m.OnCancel = action("action_resumeTransaction",function(){
            resumeTransaction(true);
        });

        templateManager.Render('fullText','#display',m);
    }
    function actionAddCouponSubmit(){
        // todo: check if valid coupon,
        // raise validation if not
        // apply and refresh
    }
    function actionFinishAndPay(){
        var m = new inputModel();
        m.OnSubmit = action("dev_pay",actionTransactionComplete);

        templateManager.Render('finishAndPay','#display',m);
    }
    function actionUnlinkAccount(){
        alert('not implemented');
    }
    function actionHelpShow(){
        var m = new inputModel();

        m.OnCancel = action("action_helpCancel",function(){
            startTransaction(appLink.CurrentCustomer());
        });

        templateManager.Render('helpScreen','#display',m);
    }
    // function actionHelpCancel(){
    //     startTransaction(appLink.CurrentCustomer());
    // }
    function actionAddCredit(){
        alert('not implemented');
    }
    function actionTransactionComplete(){
        var m = new inputModel();
        m.OnSubmit = action("action_printReceipt",function(){
            actionPrintReceipt(true);
        });
        m.OnCancel = action("action_noReceipt",function(){
            actionPrintReceipt(false);
        });

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

    function actionUnlinkAccount(){
        appLink.RemoveCustomer();
        resumeTransaction(true);
    }

    function resumeTransaction(fromFullScreen) {
        if (fromFullScreen){
            startTransaction(appLink.CurrentCustomer());
        }
        else {
            resetTransactionRight();
        }
    }

    function getFooterModel(){
        var m = new footerModel();
        var c = appLink.CurrentCustomer();
        if (appState.IsAdminMode){
            m.ContextMode = 2;
            m.ShowHelp = false;
            m.actions = [
                action("admin_exit",adminModeExit)
            ]
        }
        else if (c != null && !c.IsEmpty){
            m.ContextMode = 1;
            m.CustomerMessage = "Welcome back, " + c.Name + "!";
            m.actions = [
                action("customer_unlink",actionUnlinkAccount),
                action("help_show",actionHelpShow)
            ]
        }
        else {
            m.ContextMode = 0;
            m.CustomerMessage = "Have a Frequent Feeder Account?";
            m.actions = [
                action("customer_lookup",customerLookup),
                action("help_show",actionHelpShow)
            ];
        }

        return m;
    }

    // ADMIN FUNCTIONS //
    function adminModeEnter(){
        // if we're on Start Screen, go to the "pre-transaction" version, else
        if (false){
            // appState.TransactionStarted?
        }
        else {
            appState.IsAdminMode = true;
            templateManager.Render('admin-panel','.right-content');
            templateManager.Render('footer','.footer',getFooterModel());
            adminActionsEnableRelevant(null);
        }
    }

    function adminModeExit(){
        appState.IsAdminMode = false;
        resumeTransaction(true);
    }

    function actionPriceOverrideShow(){
        var m = new inputModel();
        m.Caption = "Reason for Price Override";
        m.Buttons = [];
        // these will probably be appLink driven
        for(i = 0; i < 4; i++){
            var b = new inputModel();
            switch(i){
                case 0:
                    b.Caption = "Price Match";
                    b.OnSubmit = "alert('PriceMatch')";
                    break;
                case 1:
                    b.Caption = "Damaged";
                    b.OnSubmit = "alert('Damaged');"
                    break;
                case 2:
                    b.Caption = "Wrong Price Marked";
                    b.OnSubmit = "alert('Wrong Price');"
                    break;
                case 3:
                    b.Caption = "Approaching Expiration";
                    b.OnSubmit = "alert('Expired!')";
                    break;
            }
            m.Buttons.push(b);
        }
        console.log(m);
        m.OnSubmit = action("action_AdminModeEnter", adminModeEnter);
        m.OnCancel = action("action_AdminModeEnter",adminModeEnter);

        templateManager.Render('admin-priceOverride','.right-content',m);

    }

    function adminRowSelect(el){
        el = el.target;
        if (!$(el).hasClass('item-row')){
            el = $(el).closest('.item-row')[0];
        }

        var isSelected = $(el).hasClass('edit-item');

        clearSelectedRows();
        adminActionsDisable();

        if (appState.IsAdminMode && !isSelected){
            $(el).addClass('edit-item');
            appState.SelectedRow = el;
            adminActionsEnableRelevant(el);
        }
        else {
            adminActionsEnableRelevant(null);
        }
    }

    function clearSelectedRows(){
        appState.SelectedRow = null;

        $('.item-row').removeClass('edit-item');
    }

    function adminActionsEnableRelevant(item){
        // start by disabling all
        var m = new adminActions();
        
        if (item != null){
            var id = item.getAttribute('data-itemid');
            m = appLink.GetItemAdminOptions(id);
        }

        adminActionsDisable();

        if (appState.SelectedRow != null){
            m.CanRemoveItem = true;
        }
        else {
            m.CanClearTransaction = true;
        }



        if (m.CanPriceOverride){
            $('.btn[data-action="price_override"]').removeClass('disabled');
        }
        if (m.CanDiscountPercent){
            $('.btn[data-action="discount_percent"]').removeClass('disabled');
        }
        if (m.CanDiscountAmount){
            $('.btn[data-action="discount_amount"]').removeClass('disabled');
        }
        if (m.CanChangeQuantity){
            $('.btn[data-action="quantity_change"]').removeClass('disabled');
        }
        if (m.CanRemoveItem){
            $('.btn[data-action="item_remove"]').removeClass('disabled');
        }
        if (m.CanClearTransaction){
            $('.btn[data-action="transaction_clear"]').removeClass('disabled');
        }
    }

    function adminActionsDisable(){
        $('.store-mode-options .btn').addClass('disabled');
    }

    return {
        startOver: startOver,
        GetState: getAppState,
        customerLookup: customerLookup,
        customerPhoneLookup: customerPhoneLookup,
        customerEmailLookup: customerEmailLookup,

        //action_EnterItem: actionEnterItem,
        //action_EnterItemSubmit: actionEnterItemSubmit,
        //action_RedeemGiftCard: actionRedeemGiftCard,
        //action_AddCoupon: actionAddCoupon,
        //action_AddCouponSubmit: actionAddCouponSubmit,
        //action_AddCredit: actionAddCredit,
        //action_ResumeTransaction: resumeTransaction,
        //action_FinishAndPay: actionFinishAndPay,
        //action_UnlinkAccount: actionUnlinkAccount,
        action_HelpShow: actionHelpShow,
        //action_HelpCancel: actionHelpCancel,
        action_TransactionComplete: actionTransactionComplete,
        //action_PrintReceipt: actionPrintReceipt,
        action_AdminModeEnter: adminModeEnter,
        action_AdminModeExit: adminModeExit,
        //action_AdminPriceOverrideShow: actionPriceOverrideShow,
        //SelectRow: adminRowSelect,
        
        

    }
})();

app.startOver();
