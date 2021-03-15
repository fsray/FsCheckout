const _successMessage = "SUCCESS";
const _errorMessage = "ERROR";
const _paymentNotRequired = "NO_PAYMENT_REQUIRED";

function inputModel(){
    this.Caption = "";
    this.OnCancel = null;
    this.OnSubmit = null;
    this.OnError = null;
}

function fullKeyboardModel(){
    this.Caption= "";
    this.OnCancel= null;
    this.OnSubmit= null;
    this.OnError= null;
}

function transactionTotalModel(){
    this.Total = 0;
    this.Tax = 0;
    this.Subtotal = 0;
    this.Discount =0;
    this.ItemCount = 0;
    this.GiftCreditRemaining = null;
}

function customerModel(){
        this.Name= "";
        this.StoreCredit= 0;
        this.LoyaltyPoints= 0;
        this.IsEmpty= true;
        this.Email= null;
        this.Phone= null;
        this.LastActive= null;
        this.LoyaltyProgramItems = []; // ItemModels that represent LoyaltyPrograms
        this.CustomerCreditInUse = false;
        this.PaymentNotRequired = false;

}

function itemModel()
{
    this.Title = null;
    this.Description = null;
    this.ImageUrl = null;

    this.PriceCurrent = "$0.00";
    this.PriceOriginal= null;

    this.Identifier = null;

    this.ItemId = null;

    this.IsOnSale = false;
    this.IsCoupon = false;
    this.Quantity = 1;
    
    this.CanRemove = false;
    this.CanApply = false;
    this.ApplyMessage = null;
    this.OnRemove = null;
    this.OnApply = null;

    this.QuantityPrompt = false;

    this.Clone = function (){
        var n = new itemModel();
        n.Title = this.Title;
        n.Description = this.Description;
        n.ImageUrl = this.ImageUrl;
        n.PriceCurrent = this.PriceCurrent;
        n.PriceOriginal = this.PriceOriginal;
        n.Identifier = this.Identifier;
        n.IsOnSale = this.IsOnSale;
        n.IsCoupon = this.IsCoupon;
        n.Quantity = 1;
        
        return n;
    }
}

function adminActions(){
    this.CanPriceOverride = false;
    this.CanDiscountPercent = false;
    this.CanDiscountAmount = false;
    this.CanChangeQuantity = false;
    this.CanRemoveItem = false;
    this.CanClearTransaction = false
}

function footerModel() {
    this.ContextMode= 0; // 0: no customer, 1: customer, 2: admin
    this.ShowHelp= true;
    this.CustomerMessage= null;
}

function adminRequest(){
    this.RequestType = requestTypeList.None;
    this.RequestAmount = "";
    this.RequestItem = null;
    this.RequestId = null;
}

function genericResponse() {

    this.Result = _errorMessage; // SUCCESS, ERROR -- defaulting to ERROR.
    this.Message = null;

    this.IsSuccess = function() {
        return this.Result == _successMessage;
    }
    this.SetSuccess = function(){
        this.Result = _successMessage;
        return;
    }
    this.SetError = function(){
        this.Result = _errorMessage;
    }
}

function paymentResult(){
    var x = new genericResponse();
    x.ReceiptPrinted = false;
    x.ReceiptEmailed = false;
    x.ReceiptEmailedTo = null;
    x.TransactionAborted = false;
    return x;
}

function adminPriceChangeReason() {
    this.Caption = null;
    this.Id = null;
}

var requestTypeList = {
    "None":"NONE",
    "PriceOverride": "PRICE_OVERRIDE",
    "DiscountPercent":"DISCOUNT_PERCENT",
    "DiscountAmount":"DISCOUNT_AMOUNT",
    "QuantityChange":"QUANTITY_CHANGE"
}

function action(name,func){
    return new dataAction(name,func);
}

function dataAction(name, func) {
    this.ActionName = name;
    this.Action = func;
}

dataAction.prototype.toString = function() {
    return this.ActionName;
}