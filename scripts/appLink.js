
var appLink = (function(fake){
  
    var itemRepository = [];
    var customerRepository = [];
    
    var transaction = [];
    
    var logger = new voice();
    
    function generateTestData(){
      itemRepository.push(new item("item1","title1",3.99,1));
      itemRepository.push(new item("item2","title2",6.99,1));
      itemRepository.push(new item("item3","title3",7.99,1));
      
      customerRepository.push(new customer("Frank",0.00,0.00));
      customerRepository.push(new customer("Steve",5.00,0.00));
      customerRepository.push(new customer("Dan",10.00,0.00));
      customerRepository.push(new customer("Mark",0.00,7.00));
    }
    
    generateTestData();
    
    function item(name, title, price, quantity){
      return {
        Artist: name,
        Title: title,
        PriceCurrent: price,
        PriceOriginal: null,
        Quantity: quantity
      }
    }
    
    function totals(total, tax, subtotal, discount){
      return {
        Total: total,
        Tax: tax,
        Subtotal:subtotal,
        Discount: discount
      }
    }
    
    function customer(name,credit,points){
      return {
        Name: name,
        StoreCredit: credit,
        LoyaltyPoints: points
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
      var subtotal = 0,
          tax = 0,
          total = 0;
      
      for(var i = 0; i < transaction.length; i++){
        subtotal += transaction[i].PriceCurrent;
      }
      
      tax = subtotal * .00; // tax rate
      total = subtotal + tax;
      
      logger.Speak('Transaction total: $' + total);
      
      return new totals (total, tax, subtotal, 0);
    }
    
    /// returns a Customer object
    function getCustomer(code){
      
    }
    
    function addItemToTransaction(item){
      logger.Speak(item.Artist + ' ' + item.Title + ' added to transaction.');
      transaction.push(item);
    }
    
    function getTransactionItems(){
      return transaction;
    }
    
    return {
      FindItem: searchItem,
      GetTotals: getTotals,
      FindCustomer: getCustomer,
      AddItemToTransaction: addItemToTransaction,
      GetTransactionItems: getTransactionItems
    }
    
  })();
  