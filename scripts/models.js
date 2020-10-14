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

function itemTotalModel(){
    this.Total = 0;
    this.Tax = 0;
    this.Subtotal = 0;
    this.Discount =0;
    this.ItemCount = 0;
}

function customerModel(){
        this.Name= "";
        this.StoreCredit= 0;
        this.LoyaltyPoints= 0;
        this.IsEmpty= credit == null && points == null && name == null;
        this.Email= null;
        this.Phone= null;
        this.LastActive= null
}

function itemModel()
{
    this.Title = null;
    this.Description = null;
    this.ImageUrl = null;

    this.PriceCurrent = "$0.00";
    this.PriceOriginal= null;
    this.IsOnSale = false;
    this.IsCoupon = false;
    this.Quantity = 1;
    this.ImageUrl = null;
    this.CanRemove = false;
    this.CanApply = false;
    this.ApplyMessage = null;
    this.OnRemove = null;
    this.OnApply = null;
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