appLink = (function(fake){
  
    var itemRepository = [];
    var customerRepository = [];
    var couponRepository = [];

    this.lineCount = 0;

    var _transaction = [];
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
    // (function() {
    //   for(var i = 0; i < 5; i++){
    //     var item = itemRepository[i % itemRepository.length];
    //     if (item){
    //       test_addToTransaction(item);
    //     }
    //   }
    // })();
    
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
      item.ImageUrl = templateManager.GetLocaleString("Asset.ImageLoading");
      item.Identifier = upc;
      
      console.log(item);
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
      x.CanApply = true;
      x.ApplyMessage = "Up to $30 off";
      //transaction.push(x);
      _transaction.unshift(x); // put item at the beginning
      getItemImage(x.ItemId);
      return x.ItemId;
    }
    
    /// returns a Customer object
    // addCustomerToTransaction
    function getCustomer(phone, email){
      _customer = new customerModel();

      return new Promise((resolve)=>{

      
        if (phone){
          for(var i = 0; i < customerRepository.length; i++){
            if (customerRepository[i].Phone.indexOf(phone) > -1){
              _customer = customerRepository[i];
            }
          }
        }
        else if (email){
          for(var i = 0; i < customerRepository.length; i++){
            if (customerRepository[i].Email.toLowerCase().indexOf(email.toLowerCase()) > -1){
              _customer = customerRepository[i];
            }
          }
        }
        else {
          _customer = customer;
        }

        resolve( _customer);

      });
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

    async function getCurrentCustomer(){
      // returns the current customer as a model
      return new Promise((resolve)=>{
        var c = new customerModel();
        c.IsEmpty = true;

        resolve(_customer == null ? c : _customer);
      })
    }

    async function addCustomerToTransaction_Phone(input){
      // search for a customer
      // set the transaction customer to this, or return empty customer if none found

      return await getCustomer(input, null);
    }

    async function addCustomerToTransaction_Email(input){
      // search for a customer
      // set the transaction customer to this, or return empty customer if none found

      return await getCustomer(null, input);
    }

    async function addItemToTransaction(input){
      // search for an item
      // add the item to the transaction if found
      // return null if nothing found
      return new Promise((resolve)=>{
        resolve(getItem(input));
      })
    }

    async function getTransactionItems(){
      return new Promise((resolve)=>{
        resolve(_transaction);
      })
       //return the transaction items for the display
    }

    function getTransactionItemById(id){
        for(var i = 0; i < _transaction.length; i++){
          if (_transaction[i].ItemId == id){
              return _transaction[i];
          }
        }
        return null;      
    }

    // this is to kinda simulate the FS way of async loading the image.. 
    function getItemImage(id){

      // simulate async image load, 500ms
      setTimeout(function(){

          let det = {
            "itemId":id,
            "image":"/images/test-item.png"
          };
          
          // update the image on the object
          for(var i = 0; i < _transaction.length; i++){
            if (_transaction[i].ItemId == id){
              _transaction[i].ImageUrl = det.image;
              break;
            }
          }
        
          // fs supplies this object as a string
          let ret = JSON.stringify(det);

          // FS does call this method directly! Otherwise, appLink shouldn't reference 'app' at all. 
          app.ImageLoad(ret);

       },500);
      
    }

    async function getTotals(){
      var t = new transactionTotalModel();
      
      // returns a Totals model

      for(var i = 0; i < _transaction.length; i++){
        t.Subtotal += _transaction[i].PriceCurrent * _transaction[i].Quantity;
        t.ItemCount = i+1;
      }
      
      t.Tax = t.Subtotal * .00; // tax rate
      t.Total = t.Subtotal + t.Tax;
      
      return new Promise((resolve)=>{
        resolve(t);
      })

    }

    async function addCouponToTransaction(input){
      // look for a coupon
      // if we find one, add it to the transaction
      // otherwise, return null

      return new Promise((resolve)=>{
        for(var i = 0; i < couponRepository.length; i++){
          if (couponRepository[i].Identifier.indexOf(input) > -1){
              test_addToTransaction(couponRepository[i]);
              resolve("SUCCESS");
          }
        }
        resolve(null);
      })
      

      // nothing found
      return null;
    }

    async function removeItemFromTransaction(itemId){
      // remove this ItemId from the transaction list

      return new Promise((resolve)=>{
        for(var i = 0; i < _transaction.length; i++){
          if (_transaction[i].ItemId === toNumber(itemId)){
            _transaction.splice(i,1);
            resolve(true);
          }
        }

      })
      
    }

    async function getPriceOverrideReasonList(itemId) {
      // itemId is kind of optiona... but return a list of reasons for the screen.
      // up to 4?

      return new Promise((resolve)=>{
        var adminList = [
          {"Caption":"Price Match","ReasonId":1},
          {"Caption":"Damaged","ReasonId":2},
          {"Caption":"Wrong Price Marked","ReasonId":3},
          {"Caption":"Approaching Expiration/Discontinued","ReasonId":4},
          {"Caption":"Frequent Feeder Adjustment","ReasonId":5},
        ]

        resolve(adminList);
      })

    }

    function toNumber(input){
      if (input == null){
        return;
      }

    if (typeof input === 'number'){
      return input;
    }

      var stripped = input.replace('$','').replace('%','');
      return parseFloat(stripped);
    }

    async function applyPriceOverride(adminRequest){
      // apply this price to the ItemId
      // reasonId should maybe be a message
      // and possibly this should change to a PriceOverrideRequest model

      return new Promise((resolve,error)=>{
        var id = adminRequest.ItemId;
        var item = getTransactionItemById(id);
        if (item != null){
          item.PriceOriginal = item.PricCurrent;
          item.PriceCurrent = toNumber(adminRequest.RequestAmount);
          resolve(true);
        }
        else {
          error('Error encountered');
        }
        
      })

      
    }

    async function applyDiscountDollar(adminRequest){
      // change the price of the itemId to this amount

      return new Promise((resolve,error)=>{
        var item = getTransactionItemById(adminRequest.ItemId);
        if (item != null){
          item.PriceOriginal = item.PricCurrent;
          item.PriceCurrent = item.PriceCurrent - toNumber(adminRequest.RequestAmount);
          resolve(true);
        }
      })
      
    }

    async function applyDiscountPercent(adminRequest){
      // discount the itemId's price by this amount

      return new Promise((resolve,error)=>{
        var item = getTransactionItemById(adminRequest.ItemId);
        if (item != null){
          item.PriceOriginal = item.PricCurrent;
          item.PriceCurrent = item.PriceCurrent * toNumber(adminRequest.RequestAmount);
          resolve(true);
        }
      })
      
    }

    async function changeQuantity(adminRequest){
      // adjust the item Quantity to this number
      // front end validation for 0?
      return new Promise((resolve)=>{
        var item = getTransactionItemById(adminRequest.ItemId);
        if (item != null){
          item.Quantity = toNumber(adminRequest.RequestAmount);
          resolve(true);
        }
      })
      
    }

    async function transactionClearItems(){
      // remove all items from the transaction
      return new Promise((resolve)=>{
        _transaction = [];
        resolve(true);
      })
      
    }

    async function transactionUnlinkCustomer(){
      // remove the customer from this transaction.
      // this may affect coupons, loyalty, credit
      return new Promise((resolve,error)=>{
        _customer = new customerModel();
        resolve(true);
      })
      
    }

    async function applyGiftCard(input){
      // search to see if this is a valid gift card
      // apply the gift card to the transaction
      // adjust the customer's available credit to have leftover
    }

    async function applyLoyaltyProgram(itemId){
      // I think these will be tied to a line-item, 
      //  so should be able to do the apply with just this info
    }

    async function validateEmployee(username, password){
      // return true/false if this passes the FS validation
    }

    async function getAdminOptionsForItem(itemId){
      // probably some actions are not valid for some items, 
      //  like adjusting the price on a coupon?

      return new Promise((resolve)=>{
        var item = null;
        for(var i = 0; i < _transaction.length; i++){
          if (_transaction[i].ItemId === itemId)
            item = _transaction[i];
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
  
        resolve(actions);
      })

    }

    async function settings_RequiresPriceOverrideReason() {
      return new Promise((resolve)=>{
        resolve(settings.RequiresPriceOverrideReason);
      })
      
    }

    async function ScanHandle(value){

      return new Promise((resolve)=>{
        if (value === 'admin'){
         resolve("ADMIN");
        }
        else if (value === 'gift'){
          var i = item("GIFT CARD","",-4.00,1,"GIFT");
          test_addToTransaction(i);
          resolve("REFRESH");
        }
        else {
          var i = item("SCANNED","ITEM",4.99,1,"scanned");
          test_addToTransaction(i);
          resolve("REFRESH");
        }
      })
      
    }

    async function transactionClearCheck() {
      return new Promise((resolve)=>{
        resolve(true);
      })

    }
    
    async function transactionReset() {
      // totally reset the transaction
      _transaction = [];
      _customer = null;
      return new Promise((resolve)=>{
        resolve(true);
      });
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
      TransactionCanReset: transactionClearCheck,
      TransactionReset: transactionReset
    }
    
  })();
  