appLink = (function(){
    
    /* 
    templateLoader = async function(path,name){
            return FieldStack.templateLoader(path,name);
    */

   function copyToWebModel(src,targ){
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
    async function addCustomerToTransaction(phone, email){
        var c = await FieldStack.AddCustomerToTransaction(phone, email);
        var ret = new customerModel();
		if (c != null){
			c = JSON.parse(c);
			copyToWebModel(c,ret);
			ret.IsEmpty = false;
		}
		return ret;
    }

    async function addItemToTransaction(value) {
        var c = await FieldStack.AddItemToTransaction(value);
        var ret = new itemModel();
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
        var ret = new itemModel();
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
        var x = await FieldStack.ItemDiscountDollar(adminRequest.ItemId, adminRequest.RequestAmount);
        return x;
    }

    async function applyDiscountPercent(adminRequest){

        var x = await FieldStack.ItemDiscountPercent(adminRequest.ItemId, adminRequest.RequestAmount);
        return x;
    }

    async function changeQuantity(adminRequest){
        var x = await FieldStack.itemChangeQuantity(adminRequest.ItemId, adminRequest.RequestAmount);
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
			ret.IsEmpty = false;
		}
		return ret;
    }

    async function ScanHandle(input){
        var x = await FieldStack.ScanHandle(input);
        return x;
    }

    async function settings_RequiresPriceOverrideReason() {

    }
    async function transactionClearCheck() {
        var res = await FieldStack.TransactionClearCheck();
        return res;
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
        
        GetScanAction: ScanHandle,
        Settings_RequiresPriceOverrideReason: settings_RequiresPriceOverrideReason,
        TransactionCanReset: transactionClearCheck
    }
    
})();