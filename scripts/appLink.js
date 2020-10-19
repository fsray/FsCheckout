
var appLink = (function(fake){
  
    var itemRepository = [];
    var customerRepository = [];
    this.lineCount = 0;

    var transaction = [];
    var _customer = null;
    
    function generateTestData(){
      itemRepository.push(new item("item1","title1",3.99,1));
      itemRepository.push(new item("item2","title2",6.99,1));
      itemRepository.push(new item("item3","title3",7.99,1));
      
      customerRepository.push(new customer("Frank",0.00,0.00,"frank1@gmail.com","207-111-2222","1/1/19"));
      customerRepository.push(new customer("Steve",5.00,0.00,"theGuy@yahoo.com","207-207-2077","2/5/19"));
      customerRepository.push(new customer("Dan",10.00,0.00,"freddyDandle@hotmail.com","207-111-1988","5/1/18"));
      customerRepository.push(new customer("Mark",0.00,7.00,"orion_belter@aol.com","601-781-8888","1/1/2000"));

      for(var i = 0; i < 1; i++){
        customerRepository = customerRepository.concat(customerRepository);
        itemRepository = itemRepository.concat(itemRepository);
      }
    }

    function generateTestTransaction(){
      for(var i = 0; i < itemRepository.length; i++){
        addItemToTransaction(itemRepository[i]);
      }
    }
    
    generateTestData();
    generateTestTransaction();
    
    function item(name, title, price, quantity){
      var item = new itemModel();
      item.Title = name;
      item.Description = title;
      item.PriceCurrent = price;
      item.Quantity = quantity;
      item.ImageUrl = "/images/test-item.png";
      
      return item;
    }
    
    function totals(total, tax, subtotal, discount){
      return {
        Total: total,
        Tax: tax,
        Subtotal:subtotal,
        Discount: discount
      }
    }
    
    function customer(name,credit,points, email, phone, lastActive){
      return {
        Name: name,
        StoreCredit: credit,
        LoyaltyPoints: points,
        IsEmpty: credit == null && points == null && name == null,
        Email: email,
        Phone: phone,
        LastActive: lastActive
      }
    }
    
    /// returns an Item object
    function searchItem(string){
      for(var i = 0; i < itemRepository.length; i++){
        if (string == itemRepository[i].Artist || string == itemRepository[i].Title){
          return itemRepository[i];
        }
      }
      
      // nothing found
      return null;
    }
    
    /// returns a Totals object
    function getTotals(){
      var t = new itemTotalModel();
      
      for(var i = 0; i < transaction.length; i++){
        console.log(transaction[i]);
        t.Subtotal += transaction[i].PriceCurrent;
        t.ItemCount = i;
      }
      
      t.Tax = t.Subtotal * .00; // tax rate
      t.Total = t.Subtotal + t.Tax;
      
      return t;
      
    }
    
    /// returns a Customer object
    function getCustomer(phone, email){
        if (phone){
           _customer = new customer('BOBBY DAVIS',12.00, 3);
        }
        else if (email){
          _customer = new customer("Sammy Happano",0, 0);
        }
        else {
          _customer = new customer(null, null, null);
        }

        return _customer;
    }

    function getCurrentCustomer(){
        return _customer == null ? new customer() : _customer;
    }
    
    function addItemToTransaction(item){
      var i = new itemModel();
      i.Title = item.Title;
      i.Description = item.Description;
      i.PriceCurrent = item.PriceCurrent;
      i.Quantity = item.PriceCurrent;
      i.ImageUrl = item.ImageUrl;
      i.ItemId = lineCount++;

      transaction.push(i);
    }
    
    function getTransactionItems(){
      return transaction;
    }

    function demo_customerList(){
      return customerRepository;
    }

    function customerRemove(){
      _customer = null;
    }

    function getAdminOptions(itemId){
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
    
    
    return {
      FindItem: searchItem,
      GetTotals: getTotals,
      FindCustomer: getCustomer,
      AddItemToTransaction: addItemToTransaction,
      GetTransactionItems: getTransactionItems,
      CurrentCustomer: getCurrentCustomer,
      GetCustomerSearch: demo_customerList,
      RemoveCustomer: customerRemove,
      GetItemAdminOptions: getAdminOptions
    }
    
  })();
  