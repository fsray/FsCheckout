
var appLink = (function(fake){
  
    var itemRepository = [];
    var customerRepository = [];
    var couponRepository = [];

    this.lineCount = 0;

    var transaction = [];
    var _customer = null;

    var settings = {
      "RequiresPriceOverrideReason":true
    }

    
    function generateTestData(){
      itemRepository.push(item("item1","title1",3.99,1,"11111"));
      itemRepository.push(item("item2","title2",6.99,1,"22222"));
      itemRepository.push(item("item3","title3",7.99,1,"33333"));
      
      customerRepository.push(customer("Frank",0.00,0.00,"frank1@gmail.com","207-111-2222","1/1/19"));
      customerRepository.push(customer("Steve",5.00,0.00,"theGuy@yahoo.com","207-207-2077","2/5/19"));
      customerRepository.push(customer("Dan",10.00,0.00,"freddyDandle@hotmail.com","207-111-1988","5/1/18"));
      customerRepository.push(customer("Mark",0.00,7.00,"orion_belter@aol.com","601-781-8888","1/1/2000"));

      couponRepository.push(coupon("10% off",.1, "c1"));
      couponRepository.push(coupon("5$ off",-5, "c2"));

    }
    
    generateTestData();
    
    function coupon(name,price, upc){
      var c = new itemModel();
      c.Name = name;
      c.PriceCurrent = price;
      c.IsCoupon = true;
      c.Identifier = upc;

      return c;
    }
    // test constructor
    function item(name, title, price, quantity, upc){
      var item = new itemModel();
      item.Title = name;
      item.Description = title;
      item.PriceCurrent = price;
      item.Quantity = quantity;
      item.ImageUrl = "/images/test-item.png";
      item.Identifier = upc;
      
      return item;
    }
    
    // test constructor
    function customer(name,credit,points, email, phone, lastActive){
      var c = new customerModel;
      c.Name = name;
      c.StoreCredit = credit;
      c.LoyaltyPoints = points;
      c.Email = email;
      c.Phone = phone;
      c.LastActive = lastActive;
      c.IsEmpty = false;

      return c;
    }
    

    function test_addToTransaction(item){
      var x = item.Clone();
      x.ItemId = this.lineCount++;
      transaction.push(x);
      return x.ItemId;
    }
    
    /// returns a Customer object
    // addCustomerToTransaction
    function getCustomer(phone, email){
      _customer = new customerModel();

        if (phone){
          for(var i = 0; i < customerRepository.length; i++){
            if (customerRepository[i].Phone.indexOf(phone) > -1){
              _customer = customerRepository[i];
            }
          }
        }
        else if (email){
          for(var i = 0; i < customerRepository.length; i++){
            if (customerRepository[i].Email.toLowerCase.indexOf(email.toLowerCase()) > -1){
              _customer = customerRepository[i];
            }
          }
        }
        else {
          _customer = customer;
        }

        return _customer;
    }


    // addItemToTransaction
    function getItem(input){
      for(var i = 0; i < itemRepository.length; i++){
        if (itemRepository[i].Identifier.indexOf(input) > -1){
          return test_addToTransaction(itemRepository[i]);
        }
      }

      // nothing found
      return null;
    }

    

    function getCurrentCustomer(){
      // returns the current customer as a model
      return _customer == null ? new customer() : _customer;
    }

    function addCustomerToTransaction_Phone(input){
      // search for a customer
      // set the transaction customer to this, or return empty customer if none found

      return getCustomer(input, null);
    }

    function addCustomerToTransaction_Email(input){
      // search for a customer
      // set the transaction customer to this, or return empty customer if none found

      return getCustomer(null, input);
    }

    function addItemToTransaction(input){
      // search for an item
      // add the item to the transaction if found
      // return null if nothing found

      return getItem(input);
    }

    function getTransactionItems(){
       //return the transaction items for the display
      return transaction;
    }

    function getTotals(){
      var t = new transactionTotalModel();
      
      // returns a Totals model

      for(var i = 0; i < transaction.length; i++){
        console.log(transaction[i]);
        t.Subtotal += transaction[i].PriceCurrent;
        t.ItemCount = i;
      }
      
      t.Tax = t.Subtotal * .00; // tax rate
      t.Total = t.Subtotal + t.Tax;
      
      return t;
      
    }

    function addCouponToTransaction(input){
      // look for a coupon
      // if we find one, add it to the transaction
      // otherwise, return null
      for(var i = 0; i < couponRepository.length; i++){
        if (couponRepository[i].Identifier.indexOf(input) > -1){
            test_addToTransaction(couponRepository[i]);
            return "SUCCESS";
        }
      }

      // nothing found
      return null;
    }

    function removeItemFromTransaction(itemId){
      // remove this ItemId from the transaction list
      for(var i = 0; i < transaction.length; i++){
        if (transaction[i].ItemId === itemId){
          transaction = transaction.splice(i,1);
        }
      }
    }

    function getPriceOverrideReasonList(itemId) {
      // itemId is kind of optiona... but return a list of reasons for the screen.
      // up to 4?

      var adminList = [
        {"Caption":"Price Match","ReasonId":1},
        {"Caption":"Damaged","ReasonId":2},
        {"Caption":"Wrong Price Marked","ReasonId":3},
        {"Caption":"Approaching Expiration/Discontinued","ReasonId":4},
        {"Caption":"Frequent Feeder Adjustment","ReasonId":5},
      ]

      return adminList;

    }

    function cleanInput(input){
      if (input == null){
        return;
      }
      return input.replace('$','').replace('%','');
    }

    function applyPriceOverride(adminRequest){
      // apply this price to the ItemId
      // reasonId should maybe be a message
      // and possibly this should change to a PriceOverrideRequest model
      var id = adminRequest.ItemId;
      for(var i = 0; i < transaction.length; i++){
        if (transaction[i].ItemId == id){
          transaction[i].PriceCurrent = cleanInput(adminRequest.RequestAmount);
          break;
        }
      }

    }

    function applyDiscountDollar(adminRequest){
      // change the price of the itemId to this amount
    }

    function applyDiscountPercent(adminRequest){
      // discount the itemId's price by this amount
    }

    function changeQuantity(adminRequest){
      // adjust the item Quantity to this number
      // front end validation for 0?
    }

    function transactionClearItems(){
      // remove all items from the transaction
      transaction = [];
    }

    function transactionUnlinkCustomer(){
      // remove the customer from this transaction.
      // this may affect coupons, loyalty, credit
      _customer = new customerModel();
    }

    function applyGiftCard(input){
      // search to see if this is a valid gift card
      // apply the gift card to the transaction
      // adjust the customer's available credit to have leftover
    }

    function applyLoyaltyProgram(itemId){
      // I think these will be tied to a line-item, 
      //  so should be able to do the apply with just this info
    }

    function validateEmployee(username, password){
      // return true/false if this passes the FS validation
    }

    function getAdminOptionsForItem(itemId){
      // probably some actions are not valid for some items, 
      //  like adjusting the price on a coupon?

      var item = null;
      for(var i = 0; i < transaction.length; i++){
        if (transaction[i].ItemId === itemId)
          item = transaction[i];
          break;
      }

      var actions = new adminActions();
      if (itemId == 1){
        return actions; // just for testing...
      }
      actions.CanChangeQuantity = true;
      actions.CanDiscountAmount = true;
      actions.CanDiscountPercent = true;
      actions.CanPriceOverride = true;
      actions.CanRemoveItem = true;

      return actions;

    }

    function settings_RequiresPriceOverrideReason() {
      return settings.RequiresPriceOverrideReason;
    }

    function ScanHandle(value){
      if (value === 'admin'){
        return "ADMIN";
      }
      // also has "REFRESH" hooked in... /shrug
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
      Settings_RequiresPriceOverrideReason: settings_RequiresPriceOverrideReason
    }
    
  })();
  