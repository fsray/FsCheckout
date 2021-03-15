////// MAIN APP LOGIC ////////
var application = function(){

    var buffer_mode = {
        "NORMAL": 0,
        "GIFT_CARD":1,
        "IGNORE_INPUT":2,
        "TRANSACTION_COMPLETE":3
    }

    var timer_mode = idleTimer.TimerMode;
    
    var appState = null;

    function resetAppState(){
        appState = {
            IsAdminMode: false,
            TransactionStarted: false,
            BufferMode: buffer_mode.NORMAL 
        };
    }

    if (true){
        function TEST(){
            resetAppState();
            resumeTransaction(true);
            adminModeEnter();
        }
    }

    // setup idle reset:
    actionListener.EventRegister('idle_reset',autoClearTransaction,'idle-transaction-reset');

    function startOver(){
        
        if (typeof TEST === 'function'){
            TEST();
            return;
        }
        
        resetAppState(); // do this whether we have a transaction going or not!
        adminModeStripUi(); // remove the Admin tags

        appLink.IsTransactionInProgress().then((result)=>{
            if (result){
                // already have a transaction! just RESUME!
                resumeTransaction(true);
            }
            else {
                // start over
                setTransactionClearTimer(null); // clear out timer when we start

                templateManager.Render("start","#display", action('customer-lookup',customerLookup));
            }
        })
    }



    function setTransactionClearTimer(timerType){
        console.log('Clear transaction set:',timerType);
        idleTimer.SetTimer(timerType,function(){
            actionListener.EventTrigger('idle_reset');
        },'idle-transaction-reset');
    }


    function autoClearTransaction(){
        
        appLink.TransactionCanReset().then(y=>{
            
            if (y){
                
                appLink.TransactionReset(false).then(d=>{
                    
                    console.log('RESETTING TRANSACTION');
                    startOver();
                });
            }
        })
    }




    function startTransaction(customer){
        templateManager.Render("scan","#display",customer);
        appState.BufferMode = buffer_mode.NORMAL;
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
            
            console.log(cust);
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

    
    function updateTransaction(){
        // dependent on the Scan template
        var items = null;

        function getItemId(ev){
            if (ev){
                ev.cancelBubble = true;
                var item = ev.target;
                if (item != null){
                    var id = $(item).data('item-id');
                    return id;
                }
            }
            return null;
        }
        
        appLink.GetTransactionItems().then((list)=>{
            
            items = list;
            items.actions = [
                action("row_select",adminRowSelect),
                action("item_remove",function(){
                    var id = getItemId(event);
                    if (id != null){
                        appLink.RemoveItemFromTransaction(id).then(b=>{
                            updateTransaction();
                            
                        });
                    }
                    else {
                        updateTransaction();
                        
                    }
                }),
                action("item_prompt",function(){
                    var id = getItemId(event);
                    if (id != null){
                        appLink.ApplyLoyaltyProgram(id).then(b=>{
                            resumeTransaction();
                            
                        });
                    }
                    else {
                        resumeTransaction();
                    }
                    
                }),
                action("item_quantity",function(){
                    var id = getItemId(event);
                    if (id != null){
                        quantityPrompt(id);
                    }
                    else {
                        resumeTransaction();
                    }
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
        
        appLink.AddCustomerToTransaction_Phone(val).then((result)=>{
            
            if (result.IsSuccess()){
                appLink.GetCurrentCustomer().then((cust)=>{
                    startTransaction(cust);
                });    
            }
            else if (result.Message > ''){
                validation(result.Message);
            }
            else {
                validation('Customer not found!');
            }
        })
    }

    function customerEmailLookup(code){
        var val = code;
        if (document.keyboardInput){
            val = document.keyboardInput.value;
        }

        
        appLink.AddCustomerToTransaction_Email(val).then((result)=>{
            
            if (result.IsSuccess()){
                appLink.GetCurrentCustomer().then((cust)=>{
                    startTransaction(cust);
                });    
            }
            else if (result.Message > ''){
                validation(result.Message);
            }
            else {
                validation('Customer not found!');
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
        clearValidation(input);
        t.addClass('validation');
        t.prepend('<span class="validation-message">' + message + '</span>');
        if (input != null){
            input.valueChanged = function(){
                clearValidation(this);
            };
        }

        $('.action-clicked').removeClass('action-clicked');
    }
    function clearValidation(input){
        var t = $(input).closest('.user-input-wrap');
        t.removeClass('validation');
        t.find('.validation-message').remove();
        input.valueChanged = null;
        $('.action-clicked').removeClass('action-clicked');
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

        appLink.AddItemToTransaction(input).then((result)=>{
            if (result.IsSuccess())
            {
                resumeTransaction();
            }
            else {
                if (result.Message > ''){
                    validation(result.Message);
                    kiosk.clearKeyboard();
                    return;
                }
                else {
                    validation("Item not found");
                    kiosk.clearKeyboard();
                    return;
                }
            }
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
            if (result.IsSuccess()){
                resumeTransaction(true);
            }
            else if (result.Message != null){
                validation(result.Message);
            }
            else {
                validation('Invalid Coupon Code');
            }
        });
    }

    function actionFinishAndPay(){
        var m = new inputModel();
        m.OnSubmit = action("dev_pay",actionTransactionComplete);

        appLink.TransactionCanFinalize().then((result)=>{
            appState.BufferMode = buffer_mode.IGNORE_INPUT;

            if (result.Message == _paymentNotRequired){
                // don't need to show the credit-card screen!
            }
            else {
                templateManager.Render('finishAndPay','#display',m);
            }

            appLink.TransactionFinalize().then(b=>{

                appState.BufferMode = buffer_mode.TRANSACTION_COMPLETE;
                
                if (b.IsSuccess() && b.TransactionAborted){
                    startOver();
                }
                else if (b.IsSuccess()){
                    actionTransactionComplete(b);
                }
                else {
                    resumeTransaction(true);
                }
                
            }).catch(e=>{
                var m = _getHelpModel();
                m.HelpMessage = templateManager.GetLocaleString("Error.PaymentException");
                console.log('ERROR:',m);
                _setHelpMode(m);
            });

        })       
    }

    function actionUnlinkAccount(){
        
        appLink.TranasctionUnlinkCustomer().then(()=>{
            
            resumeTransaction();
        });
    }
    function actionHelpShow(){
        var m = _getHelpModel();
        _setHelpMode(m);
    }

    function _setHelpMode(m){
        templateManager.Render('helpScreen','#display',m);

        appState.IsHelpMode = true;
    }

    function _getHelpModel(){
        var m = new inputModel();

        m.OnCancel = action("action_helpCancel",function(){
            
            appLink.GetCurrentCustomer().then((cust)=>{
                
                startTransaction(cust);
            });

        });

        return m;
    }

    
    function actionAddCredit(){
        appLink.ApplyStoreCredit().then((result)=>{
            resumeTransaction();
        })
    }
    function actionTransactionComplete(paymentResultResponse){
                
        paymentResultResponse.OnSubmit = action("action_printReceipt",function(){
            actionPrintReceipt(true);
        });

        paymentResultResponse.OnCancel = action("action_noReceipt",function(){
            startOver();
        });

        templateManager.Render('transactionComplete','#display',paymentResultResponse);
        setTransactionClearTimer(timer_mode.RECEIPT_UNKNOWN);
        
    }

    function actionPrintReceipt(yes){

        // will startover after a few seconds
        setTransactionClearTimer(timer_mode.RECEIPT_CHOSEN);

        appLink.TransactionReceiptPrint(yes).then(r=>{
            setTransactionClearTimer(timer_mode.RECEIPT_CHOSEN);
        });
    }

    function actionUnlinkAccount(){
        
        appLink.TranasctionUnlinkCustomer().then(()=>{
            
            resumeTransaction(true);
        });
    }

    async function resumeTransaction(fromFullScreen) {
        appState.BufferMode = buffer_mode.NORMAL;
        clearSelectedRows();

        return new Promise((res)=>{
            if (fromFullScreen){
            
                appLink.GetCurrentCustomer().then((cust)=>{
                    startTransaction(appLink.GetCurrentCustomer());
                    res(true);
                })
            }
            else {
                updateTransaction();
                resetTransactionRight();
                res(true);
            }
        })
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
        if (!appState.TransactionStarted){
            $(document.body).addClass('store-mode');
            appState.IsAdminMode = true;

            // create "PRE-TRANSCTION model";
            var m = new inputModel();
            m.actions = [
                action("admin_drawerClose",appLink.AdminDrawerClose),
                action("admin_exitKiosk",appLink.AdminLaunchApplication)

            ];
            
            templateManager.Render('admin-preTransaction','#display', m);
            getFooterModel().then(m=>{
                templateManager.Render('footer','.footer',m);
            });
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

    function adminModeStripUi(){
        appState.IsAdminMode = false;
        $(document.body).removeClass('store-mode');
    }

    function adminModeExit(ignoreReset){
        
        adminModeStripUi();

        if (ignoreReset === undefined || ignoreReset){
            if (appState.TransactionStarted){
                resumeTransaction(true);
            }
            else {
                startOver();
            }
        }
    }

    function adminDiscountAmount() {
        var submit = action("action_DiscountDollar",function(){
            var i = helper_inputValue();
            if (i > ''){
                appState.AdminRequest.RequestAmount = i;
                actionPriceOverrideReasonList(appLink.ApplyDiscountDollar);
                
            }
            else {
                validation('Enter an Amount to discount');
            }
        })

        getAdminRequest(requestTypeList.DiscountAmount, submit);
    }

    function adminQuantityChange() {
        var submit = action("action_ChangeQuantity",_quantityChangeAction);
        getAdminRequest(requestTypeList.ChangeQuantity, submit);
    }

    function _quantityChangeAction(){
        if (appState.AdminRequest == null)
        {
            resumeTransaction();
            return;
        }

        var i = helper_inputValue();
        if (i > '' ){

            appState.AdminRequest.RequestAmount = i;
            var result = appLink.ChangeQuantity(appState.AdminRequest).then(b=>{
                resumeTransaction();
                
            });
        }
        else {
            validation('Enter a Quantity');
        }
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
        appLink.TransactionReset(true).then(a=>{
            if (a){
                startOver();
            }
            else {
                resumeTransaction(true);
            }
        })
    }



    function adminDiscountPercent(){
        var submit = action("action_DiscountPercentage",function(){
            var i = helper_inputValue();
            if (i > ''){
                appState.AdminRequest.RequestAmount = i;
                actionPriceOverrideReasonList(appLink.ApplyDiscountPercent);
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
                actionPriceOverrideReasonList(appLink.ApplyPriceOverride);
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

    async function actionPriceOverrideReasonList(overrideAction){

        //var reasons = appLink.GetPriceOverrideReasonList();
        appLink.GetPriceOverrideReasonList().then((reasons)=>{
            
            if (reasons == null || reasons.length == 0){
                // no reasons required:
                overrideAction(appState.AdminRequest).then(()=>{
                    resumeTransaction();
                });  
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

                m.OnCancel = action("action_cancelChange", resumeTransaction);
                m.OnSubmit = action("action_submitChange", function() {
        
                    if (appState.AdminRequest.RequestId != null){
                        
                        overrideAction(appState.AdminRequest).then(()=>{
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

        if (appState.SelectedRow == null){
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

        if (appState.BufferMode == buffer_mode.IGNORE_INPUT){
            return;
        }
        else if (appState.BufferMode === buffer_mode.GIFT_CARD){
            appLink.ApplyGiftCard(scanValue).then((result)=>{
                resumeTransaction();
            });
        }
        else if (appState.BufferMode == buffer_mode.TRANSACTION_COMPLETE){
                startOver();
        }
        else {
            appLink.GetScanAction(scanValue, appState).then((result)=>{
                if (result == 'ADMIN'){
                    adminModeEnter();
                }
                else if (result == 'REFRESH'){
                    if (!appState.TransactionStarted){
                        startTransaction(appLink.GetCurrentCustomer());
                    }
                    else if (appState.IsHelpMode){
                      resumeTransaction(true);
                    }
                    else {
                      resumeTransaction();
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
            try {
                for (var i = 0; i < obj.length; i++) {
                    var itemId = obj[i].itemId;
                    var img = obj[i].image;

                    if (img == null) {
                        img = templateManager.GetLocaleString("Asset.ImageNotFound");
                    }

                    // blindly push it out!!
                    $('img[data-item-id="' + itemId + '"]').attr('src', img);
                }
            }
            catch (f) {
                console.log(f);
            }
        }
    }

    function image_not_found(el) {
        if (el != null){
            el.setAttribute('src',templateManager.GetLocaleString("Asset.ImageNotFound"));
            el.onerror = "";
        }
    }

    // int!
    function quantityPrompt(itemId){
        if (itemId != null){
            var m = new inputModel();
            m.Caption = "Enter Quantity";

            appState.AdminRequest = new adminRequest();
            appState.AdminRequest.RequestType = requestTypeList.QuantityChange;
            appState.AdminRequest.ItemId = itemId;
    
            var m = new inputModel();
            m.Caption = "Enter new Quantity";
            m.IsNumber = true;

            m.OnSubmit = action('action_QuantityChangeCustomer',_quantityChangeAction);
            m.OnCancel = action("action_CancelAdmin",resumeTransaction);
            templateManager.Render('numericPad','.right-content',m);
        }
    }

    function setOfflineMode(isOffline){
        if (isOffline){
            idleTimer.DisableTimer();   
            var m = _getHelpModel();
            m.HelpMessage = templateManager.GetLocaleString("Error.ApplicationOffline");
            m.NoFooter = true;
            _setHelpMode(m);
        }
        else {
            startOver();
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
        ImageLoad: loadItemImage,
        ImageError: image_not_found,
        RequestQuantityChange: quantityPrompt,
        SetOfflineMode: setOfflineMode
    }
}

