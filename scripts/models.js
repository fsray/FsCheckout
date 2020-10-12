function footerModel() {
    return {
        CustomerName: null,
        IsStoreMode: false
    }
}

function inputModel(){
    return {
        Caption: "",
        OnCancel: null,
        OnSubmit: null,
        OnError: null
    }
}

function fullKeyboardModel(){
    return {
        Caption: "",
        OnCancel: null,
        OnSubmit: null,
        OnError: null
    }
}

function itemTotalModel(){
    return {
        Total: 0,
        Tax: 0,
        Subtotal: 0,
        Discount: 0
    }
}

function customerModel(){
    return {
        Name: "",
        StoreCredit: 0,
        LoyaltyPoints: 0,
        IsEmpty: credit == null && points == null && name == null,
        Email: null,
        Phone: null,
        LastActive: null
    }
}

function itemModel()
{
    return {
        Title: null,
        Description: null,
        PriceCurrent: "$0.00",
        PriceOriginal: null,
        Quantity: 1,
        ImageUrl: null,
        CanRemove: false,
        CanApply: false,
        ApplyMessage: null,
        OnRemove: null,
        OnApply: null
    }
}

function adminActions(){
    return {
        CanPriceOverride: false,
        CanDiscountPercent: false,
        CanDiscountAmount: false,
        CanChangeQuantity: false,
        CanRemoveItem: false,
        CanClearTransaction: false
    }
}

function footerModel() {
    return {
        ContextMode: 0, // 0: no customer, 1: customer, 2: admin
        ShowHelp: true,
        CustomerMessage: null,
    }
}