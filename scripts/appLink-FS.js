appLink = (function(){

   function copyToWebModel(src,targ){

       if (typeof src === "string"){
           try {
            src = JSON.parse(src);
           }
           catch {}
       }

        for(var prop in src){
            targ[prop] = src[prop];
        }
    }
    
    // just some helpers... 
    async function addCustomerToTransaction_Phone(value) {
        //return addCustomerToTransaction(value);
		return await addCustomerToTransaction(value,null);
		
    }

    async function addCustomerToTransaction_Email(value) {
        return await addCustomerToTransaction(null, value);
    }

    
    // takes the search term and applies the single customer result
    // change to return GenericResponse
    async function addCustomerToTransaction(phone, email){
        var c = await FieldStack.AddCustomerToTransaction(phone, email);
        var ret = new genericResponse();
		if (c != null){
			c = JSON.parse(c);
			copyToWebModel(c,ret);
		}
		return ret;
    }

    async function addItemToTransaction(value) {
        var c = await FieldStack.AddItemToTransaction(value);
        var ret = new genericResponse();
        if (c != null){
            c = JSON.parse(c);
            copyToWebModel(c,ret);
        }
        return ret;
    }

    async function getTransactionItems() {
        var c = await FieldStack.GetTransactionItems();
        var ret = [];
        if (c != null){
            c = JSON.parse(c);
			for(var i = 0; i < c.length; i++){
				let j = new itemModel();
				copyToWebModel(c[i],j);
				ret.push(j);	
			}
            
        }
        return ret;
    }

    async function getTotals(){
        var c = await FieldStack.GetTotals();
        var ret = new transactionTotalModel();
        if (c != null){
            c = JSON.parse(c);
            copyToWebModel(c,ret);
        }
        return ret;
    }

    async function addCouponToTransaction(value) {
        var x = await FieldStack.AddCouponToTransaction(value);
        var ret = new genericResponse();
        if (x != null){
            x = JSON.parse(x);
            copyToWebModel(x,ret);
        }
        return ret;
    }

    async function removeItemFromTransaction(ItemId) {
        var x = await FieldStack.ItemRemoveFromTransaction(ItemId);
        return x;
    }

    async function getPriceOverrideReasonList() {
        var x = await FieldStack.PriceOverrideReasonListGet();
        if (x != null){
            x = JSON.parse(x);
            return x;
        }

        return null;
    }

    async function applyPriceOverride(adminRequest) {
        var x = await FieldStack.ItemPriceOverride(adminRequest.ItemId, adminRequest.RequestAmount, adminRequest.RequestId);
        return x;
    }

    async function applyDiscountDollar(adminRequest){
        var x = await FieldStack.ItemDiscountDollar(adminRequest.ItemId, adminRequest.RequestAmount, adminRequest.RequestId);
        return x;
    }

    async function applyDiscountPercent(adminRequest){

        var x = await FieldStack.ItemDiscountPercent(adminRequest.ItemId, adminRequest.RequestAmount, adminRequest.RequestId);
        return x;
    }

    async function changeQuantity(adminRequest){
        var x = await FieldStack.ItemChangeQuantity(adminRequest.ItemId, adminRequest.RequestAmount);
        return x;
    }

    async function transactionClearItems() {
        var x = await FieldStack.TransactionClearItems();
        return x;
    }

    async function transactionUnlinkCustomer() {
        var x = await FieldStack.UnlinkCustomerFromTransaction();
        return true;
    }

    async function applyGiftCard(value){
        /*
            result object = {
                success: false,
                errormessage: ""
            }
        */

        var x = await FieldStack.ApplyGiftCard(value);
        return x;
    }

    async function applyLoyaltyProgram(ItemId){
        var x = await FieldStack.ApplyLoyaltyProgram(ItemId);
        var ret = new genericResponse();
        copyToWebModel(x,ret);
        return ret;
    }

    // todo?
    async function validateEmployee(input){

    }

    async function getAdminOptionsForItem(ItemId){
        var x = await FieldStack.GetAdminOptionsForItem(ItemId);
        var ret = new adminActions();
        if (x != null){
            x = JSON.parse(x);
            copyToWebModel(x,ret);
        }
        return ret;
    }

    async function getCurrentCustomer() {
		var c = await FieldStack.GetCurrentCustomer();
		var ret = new customerModel();
		if (c != null){
			c = JSON.parse(c);
			copyToWebModel(c,ret);
		}
		return ret;
    }

    async function ScanHandle(input, appState){
        var x = await FieldStack.ScanHandle(input, appState);
        return x;
    }

    async function settings_RequiresPriceOverrideReason() {

    }
    async function transactionClearCheck() {
        var res = await FieldStack.TransactionClearCheck();
        return res;
    }

    async function transactionReset(ignoreErrors){
        var x = await FieldStack.TransactionReset(ignoreErrors);
        return x;
    }

    async function transactionReceiptPrint(doPrint){
        await FieldStack.TransactionReceiptPrint(doPrint);
    }

    async function transactionFinalize(){
        var x = await FieldStack.TransactionCanFinalize();
        var canFinalize = new genericResponse();
        canFinalize.SetError();
        canFinalize.Message = "Unknown error occurred.";

        if (x != null){

            x = JSON.parse(x);
            copyToWebModel(x, canFinalize);

            // if we CAN finalize, give it a try!
            if (canFinalize.IsSuccess()){

                var r = await FieldStack.TransactionFinalize();
                var finalizeResult = new paymentResult();
                r = JSON.parse(r);
                copyToWebModel(r,finalizeResult);
                
                return finalizeResult;
            }
            else {
                return canFinalize;
            }
        }
    }

    function adminLaunchApplication() {
        FieldStack.KioskModeExit();
    }

    async function adminDrawerClose() {
        var x = await FieldStack.AdminDrawerClose();
        return x;
    }

    async function applyStoreCredit() {
        var x = await FieldStack.ApplyAvailableCredit();
        var ret = new genericResponse();
        if (x != null){
            x = JSON.parse(x);
            copyToWebModel(x,ret);
        }
        
        return ret;
    }

    async function isTransactionInProgress() {
        return await FieldStack.IsTransactionInProgress();
    }

    async function transactionCanFinalize() {
        var x = await FieldStack.TransactionCanFinalize();
        var ret = new genericResponse();
        copyToWebModel(x,ret);
        return ret;
    }
   
    
    return {
        AddCustomerToTransaction_Phone: addCustomerToTransaction_Phone,
        AddCustomerToTransaction_Email: addCustomerToTransaction_Email,
        AddItemToTransaction: addItemToTransaction,
        GetTransactionItems: getTransactionItems,
        GetTotals: getTotals,
        AddCouponToTransaction: addCouponToTransaction,
        RemoveItemFromTransaction: removeItemFromTransaction,
        GetPriceOverrideReasonList: getPriceOverrideReasonList,
        ApplyPriceOverride: applyPriceOverride,
        ApplyDiscountDollar: applyDiscountDollar,
        ApplyDiscountPercent: applyDiscountPercent,
        ChangeQuantity: changeQuantity,
        TransactionClearItems: transactionClearItems,
        TranasctionUnlinkCustomer: transactionUnlinkCustomer,
        ApplyGiftCard: applyGiftCard,
        ApplyLoyaltyProgram: applyLoyaltyProgram,
        ValidateEmployee: validateEmployee,
        GetAdminActionsForItem: getAdminOptionsForItem,
        GetCurrentCustomer: getCurrentCustomer,
        ApplyStoreCredit: applyStoreCredit,
        
        GetScanAction: ScanHandle,
        Settings_RequiresPriceOverrideReason: settings_RequiresPriceOverrideReason,
        TransactionCanReset: transactionClearCheck,
        TransactionReset: transactionReset,
        TransactionReceiptPrint: transactionReceiptPrint,
        TransactionFinalize: transactionFinalize,
        TransactionCanFinalize: transactionCanFinalize,
        AdminLaunchApplication: adminLaunchApplication,
        AdminDrawerClose: adminDrawerClose,
        IsTransactionInProgress: isTransactionInProgress
    }
    
})();