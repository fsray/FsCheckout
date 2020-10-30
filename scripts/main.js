////// MAIN APP LOGIC ////////
var application = function(){

    // what to do with background scanning?

    var buffer_mode = {
        "NORMAL": 0,
        "GIFT_CARD":1
    }

    var timer_mode = idleTimer.TimerMode;

    if (false){
        function TEST(){
            customerPhoneLookup('1');
            actionEnterItemSubmit('1');
            adminModeEnter();
            updateTransaction();
        }
    }

    // setup idle reset:
    actionListener.EventRegister('idle_reset',autoClearTransaction);


    function startOver(){
        if (typeof TEST === 'function'){
            TEST();
            return;
        }
        console.log('start over');
        
        appState.TransactionStarted = false;
        
        setTransactionClearTimer(null); // clear out timer when we start

        templateManager.Render("start","#display", action('customer-lookup',customerLookup));
    }



    function setTransactionClearTimer(timerType){
        console.log('Clear transaction set:',timerType);
        idleTimer.SetTimer(timerType,function(){
            actionListener.EventTrigger('idle_reset');
        });
    }


    function autoClearTransaction(){
        appLink.TransactionCanReset().then(y=>{
            if (y){
                appLink.TransactionReset().then(d=>{
                    console.log('RESETTING TRANSACTION');
                    startOver();
                });
            }
        })
    }


    var appState = {
        IsAdminMode: false,
        TransactionStarted: false,
        BufferMode: buffer_mode.NORMAL 
    }

    function startTransaction(customer){
        templateManager.Render("scan","#display",customer);
        appState.TransactionStarted = true;
        appState.IsHelpMode = false;
        resetTransactionRight();
        updateTransaction();
    }

    function resetTransactionRight(){

        if (appState.IsAdminMode){
            adminModeEnter();
            return;
        }

        var m = null;
        appLink.GetCurrentCustomer().then((cust)=>{
            m = cust;
            m.actions = [
                action("action_enterItem",actionEnterItem),
                action("action_redeemGiftCard",actionRedeemGiftCard),
                action("action_addCredit",actionAddCredit),
                action("action_addCoupon",actionAddCoupon),
                action("finish_pay",actionFinishAndPay)
            ]

            templateManager.Render("tran-right",'.right-content',m)
        });
        
    }
    
    function addCustomerToTransaction(customer){
        // TODO: update the Credit, other things?
    }
    
    function updateTransaction(){
        // dependent on the Scan template
        var items = null;
        appLink.GetTransactionItems().then((list)=>{
            items = list;
            items.actions = [
                action("row_select",adminRowSelect),
                action("item_remove",function(){
                    event.cancelBubble = true;
                    var item = event.target;
                    if (item != null){
                        var id = $(item).data('item-id');
                        appLink.RemoveItemFromTransaction(id);
                    }
                    updateTransaction();
                }),
                action("item_prompt",function(){
                    event.cancelBubble = true;
                    var item = event.target;
                    if (item != null){
                        var id = $(item).data('item-id');
                        appLink.ApplyLoyaltyProgram(id);
                    }
                    updateTransaction();
                })
            ]
            templateManager.Render("itemList",".item-container",items);
            appLink.GetTotals().then((t)=>{
                templateManager.Render("itemTotal",".totals",t);
            })
            getFooterModel().then(f=>{
                templateManager.Render('footer','.footer',f);
            })
            
        });

        setTransactionClearTimer(timer_mode.TRANSACTION_IDLE);
    }

    function customerLookup(){

        setTransactionClearTimer(timer_mode.TRANSACTION_IDLE); 
        templateManager.Render("customerEntry","#display");
    }

    function customerPhoneLookup(code){
        var val = code;
        if (document.keyboardInput){
            val = document.keyboardInput.value;
        }

        appLink.AddCustomerToTransaction_Phone(val).then((cust)=>{
            if (cust.IsEmpty){
                validation('Customer not found!');
            }
            else {
                startTransaction(cust);
            }
        })
    }

    function customerEmailLookup(code){
        var val = code;
        if (document.keyboardInput){
            val = document.keyboardInput.value;
        }

        appLink.AddCustomerToTransaction_Email(val).then((cust)=>{
            if (cust.IsEmpty){
                validation(document.keyboardInput,'Customer not found!');
            }
            else {
                startTransaction(cust);
            }
        });
    }

    function getAppState(){
        return appState;
    }

    function validation(message){
        if (document.keyboardInput != null){
            _set_validation(document.keyboardInput, message);
        }
        else {
            console.log('set-validation error',message);
        }
    }

    function _set_validation(input,message){
        var t = $(input).closest('.user-input-wrap');
        t.addClass('validation');
        t.prepend('<span class="validation-message">' + message + '</span>');
        if (input != null){
            input.valueChanged = function(){
                clearValidation(this);
            };
        }
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
    function actionEnterItemSubmit(val){
        var input = val;
        if (document.keyboardInput){
            input = document.keyboardInput.value;
        }
        if (input == null){
            resumeTransaction();
            return;
        }

        appLink.AddItemToTransaction(input).then((item)=>{
            if (item === null){
                validation('Item not found');
                kiosk.clearKeyboard();
                return;
            }

            resumeTransaction();
        });
    }

    function actionRedeemGiftCard(){
        var m = new inputModel();
        m.Caption = "Scan your giftcard";
        m.OnCancel = action("action_resumeTransaction",resumeTransaction);

        templateManager.Render('giftCard','.right-content', m);
        appState.BufferMode = buffer_mode.GIFT_CARD;
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
        var input = helper_inputValue();
        appLink.AddCouponToTransaction(input).then((result)=>{
            // raise validation if not
            if (result == "SUCCESS"){
                resumeTransaction(true);
            }
            else if (result != null){
                validation(result);
            }
            else {
                validation('Invalid Coupon Code');
            }
        });
    }

    function actionFinishAndPay(){
        var m = new inputModel();
        m.OnSubmit = action("dev_pay",actionTransactionComplete);

        templateManager.Render('finishAndPay','#display',m);
    }
    function actionUnlinkAccount(){
        appLink.TranasctionUnlinkCustomer().then(()=>{
            resumeTransaction();
        });
    }
    function actionHelpShow(){
        var m = new inputModel();

        m.OnCancel = action("action_helpCancel",function(){
            
            appLink.GetCurrentCustomer().then((cust)=>{
                startTransaction(cust);
            });

        });

        templateManager.Render('helpScreen','#display',m);

        appState.IsHelpMode = true;
    }

    
    function actionAddCredit(){
        TODO('not implemented');
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
        setTransactionClearTimer(timer_mode.RECEIPT_UNKNOWN);
        
    }

    function actionPrintReceipt(yes){

        // will startover after a few seconds
        setTransactionClearTimer(timer_mode.RECEIPT_CHOSEN);

        if (yes){
            // appLink print receipt
            TODO('Printing Receipt... PLACEHOLDER!');
            // TODO: APPLLINK!
            // callback for "OnDonePrinting"
            return;
        }

        // TODO: APPLLINK!
        startOver();
    }

    function actionUnlinkAccount(){
        appLink.TranasctionUnlinkCustomer().then(()=>{
            resumeTransaction(true);
        });
    }

    function resumeTransaction(fromFullScreen) {
        if (fromFullScreen){
            appLink.GetCurrentCustomer().then((cust)=>{
                startTransaction(appLink.GetCurrentCustomer());
            })
        }
        else {
            updateTransaction();
            resetTransactionRight();
        }

        appState.BufferMode = buffer_mode.NORMAL;
        /// does this happen at the right time?? 
        clearSelectedRows();
    }

    async function getFooterModel(){
        
        return appLink.GetCurrentCustomer().then((c)=>{
            var m = new footerModel();

            if (appState.IsAdminMode){
                m.ContextMode = 2;
                m.ShowHelp = false;
                m.CustomerMessage = "Store Mode";
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
                m.CustomerMessage = templateManager.GetLocaleString("Footer_NoCustomerHint","Have a Frequent Feeder Account?");
                m.actions = [
                    action("customer_lookup",customerLookup),
                    action("help_show",actionHelpShow)
                ];
            }
    
            return m;
        });
        
    }

    // ADMIN FUNCTIONS //
    function adminModeEnter(){
        // if we're on Start Screen, go to the "pre-transaction" version, else
        if (false){
            // appState.TransactionStarted?
        }
        else {
            $(document.body).addClass('store-mode');
            appState.IsAdminMode = true;
            var m = new inputModel();
            m.actions = [
                action("admin_enterItem",actionEnterItem),
                action("price_override",actionPriceOverrideShow),
                 action("discount_percent",adminDiscountPercent),
                 action("discount_amount",adminDiscountAmount),
                 action("quantity_change",adminQuantityChange),
                 action("item_remove",adminItemRemove),
                 action("transaction_clear",adminTransactionClear)
            ];

            templateManager.Render('admin-panel','.right-content',m);
            getFooterModel().then(f=>{
                templateManager.Render('footer','.footer',f);
            })
            
            adminActionsEnableRelevant(null);
        }
    }

    function adminModeExit(){
        appState.IsAdminMode = false;
        $(document.body).removeClass('store-mode');
        resumeTransaction(true);
    }

    function adminDiscountAmount() {
        var submit = action("action_DiscountDollar",function(){
            var i = helper_inputValue();
            if (i > ''){
                appState.AdminRequest.RequestAmount = i;
                appLink.ApplyDiscountDollar(appState.AdminRequest).then((result)=>{
                    resumeTransaction();
                });
                
            }
            else {
                validation('Enter an Amount to discount');
            }
        })

        getAdminRequest(requestTypeList.DiscountAmount, submit);
    }

    function adminQuantityChange() {
        var submit = action("action_ChangeQuantity",function(){
            var i = helper_inputValue();
            if (i > ''){
                appState.AdminRequest.RequestAmount = i;
                var result = appLink.ChangeQuantity(appState.AdminRequest);
                resumeTransaction();
            }
            else {
                validation('Enter a Quantity');
            }
        })

        getAdminRequest(requestTypeList.ChangeQuantity, submit);
    }

    function adminItemRemove() {
        if (appState.SelectedRow == null || appState.SelectedId == null){
            return;
        }

        appLink.RemoveItemFromTransaction(appState.SelectedId).then(()=>{
            resumeTransaction();
        });

    }

    function adminTransactionClear() {
        appLink.TransactionClearItems().then(()=>{
            resumeTransaction();
        });
    }



    function adminDiscountPercent(){
        var submit = action("action_DiscountPercentage",function(){
            var i = helper_inputValue();
            if (i > ''){
                appState.AdminRequest.RequestAmount = i;
                appLink.ApplyDiscountPercent(appState.AdminRequest).then((result)=>{
                    resumeTransaction();
                });
            }
            else {
                validation('Enter a percentage to discount');
            }
        })

        getAdminRequest(requestTypeList.DiscountPercent, submit);

    }


    function actionPriceOverrideShow(){

        var submit = action("action_OverrideReasonSelect",function(){
            var i = helper_inputValue();
            if (i > ''){
                appState.AdminRequest.RequestAmount = i;
                actionPriceOverrideReasonList();
            }
            else {
                validation('Amount is invalid');
            }
        });

        getAdminRequest(requestTypeList.PriceOverride, submit);
    }

    function getAdminRequest(requestType, submitAction){
        if (appState.SelectedRow == null){
            return;
        }

        appState.AdminRequest = new adminRequest();
        appState.AdminRequest.RequestType = requestType;
        appState.AdminRequest.ItemId = appState.SelectedId;

        var m = new inputModel();
        switch(requestType){
            case requestTypeList.PriceOverride:
                m.Caption = "Enter Price for Override";
                m.IsMoney = true;
                break;
            case requestTypeList.DiscountPercent:
                m.Caption = "Enter Percentage to Discount";
                m.IsPercent = true;
                break;
            case requestTypeList.DiscountAmount:
                m.IsMoney = true;
                m.Caption = "Enter Amount to Discount";
                break;
            case requestTypeList.QuantityChange:
                m.Caption = "Enter new Quantity";
                m.IsNumber = true;
                break;
        }
        m.OnSubmit = submitAction;
        m.OnCancel = action("action_CancelAdmin",resumeTransaction);
        templateManager.Render('numericPad','.right-content',m);
    }

    function helper_inputValue() {
        if (document.keyboardInput != null){
            return document.keyboardInput.value;
        }

        return null;
    }

    async function actionPriceOverrideReasonList(){

        //var reasons = appLink.GetPriceOverrideReasonList();
        appLink.GetPriceOverrideReasonList().then((reasons)=>{
            
            if (reasons == null || reasons.length == 0){
                // no reasons requrired:
                appLink.ApplyPriceOverride(appState.AdminRequest).then(()=>
                    resumeTransaction()
                );
            }
            else {
                // yes reasons required!
                var m = new inputModel();
                m.Caption = "Reason for Price Override";
                m.Buttons = [];
        
                for(let i = 0; i < reasons.length; i++){
                    var b = new inputModel();
                    b.Caption = reasons[i].Caption;
                    
                    b.OnSubmit = action("reason_" + reasons[i].ReasonId, function(){
                        appState.AdminRequest.RequestId = reasons[i].ReasonId;
                        $('.override-options .btn').removeClass('option-selected');
                        $(this).addClass('option-selected');
                        $('.price-override .ok-btn').removeAttr('disabled');
                    });
        
                    m.Buttons.push(b);
                }

                m.OnSubmit = action("action_AdminModeEnter", resumeTransaction);
                m.OnCancel = action("action_AdminModeEnter", function() {
        
                    if (appState.AdminRequest.RequestId != null){
        
                        appLink.ApplyPriceOverride(appState.AdminRequest).then(()=>{
                            resumeTransaction();
                        });                        
                    }
                });

                templateManager.Render('admin-priceOverride','.right-content',m);

            }
        });
        
    }

    function TODO(name){
        alert(name);
    }


    async function adminRowSelect(el){
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
            appState.SelectedId = $(el).find('a').data('item-id');
            await adminActionsEnableRelevant(el);
        }
        else {
            adminActionsEnableRelevant(null);
        }
    }

    function clearSelectedRows(){
        appState.SelectedRow = null;
        appState.AdminRequest = null;

        $('.item-row').removeClass('edit-item');
        adminActionsEnableRelevant(null);
    }

    async function adminActionsEnableRelevant(item){
        // start by disabling all
        adminActionsDisable();


        var m = new adminActions();
        
        if (item != null){
            var id = $(item).data('item-id');
            //var id = item.getAttribute('data-item-id');
            m = await appLink.GetAdminActionsForItem(id);
        }

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

    function background_scanHandle(scanValue){
        if (appState.BufferMode === buffer_mode.GIFT_CARD){
            appLink.ApplyGiftCard(scanValue).then((result)=>{
                if (result.success){
                    resumeTransaction();
                }
                else {
                    // validation message??
                }
            });
        }
        else {
            appLink.GetScanAction(scanValue).then((result)=>{
                if (result == 'ADMIN'){
                    if (appState.TransactionStarted){
                        adminModeEnter();
                    }
                    else {
                        // launch "no transaction admin mode"
                        TODO('lanuch non-transaction admin mode');
                    }
                }
                else if (result == 'REFRESH'){
                    if (!appState.TransactionStarted){
                        startTransaction(appLink.GetCurrentCustomer());
                    }
                    else if (appState.IsHelpMode){
                      resumeTransaction(true);
                    }
                    else {
                      updateTransaction();
                    }
                }
            });
        }
    }

    function transactionChanged() {
        updateTransaction();
    }

    function loadItemImage(obj){
        if (obj != null){
            obj = JSON.parse(obj);
            var itemId = obj.itemId;
            var img = obj.image;

            if (img == null){
                img = templateManager.GetLocaleString("Asset.ImageNotFound");
            }

            // blindly push it out!!
            $('img[data-item-id="' + itemId + '"]').attr('src',img);
        }
    }



    return {
        startOver: startOver,
        GetState: getAppState,
        customerLookup: customerLookup,
        customerPhoneLookup: customerPhoneLookup,
        customerEmailLookup: customerEmailLookup,
        action_HelpShow: actionHelpShow,
        action_TransactionComplete: actionTransactionComplete,
        action_AdminModeEnter: adminModeEnter,
        action_AdminModeExit: adminModeExit,
        Background_ScanHandle: background_scanHandle,
        Background_TransactionChanged: transactionChanged,
        ImageLoad: loadItemImage
    }
}

