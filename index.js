const express = require('express');
const admin=require('firebase-admin');
const cheerio = require('cheerio'); 
const request =require('request');

admin.initializeApp()
const db=admin.firestore()
db.settings({
  ignoreUndefinedProperties: true,
})
const app = express();




  async function update (dataOfProducts)  {
    try {
     
      let id=dataOfProducts.Product_ID;
    if(dataOfProducts.Condition_1_Product_Price_IDs){
      id=dataOfProducts.Condition_1_Product_Price_IDs;
    }
    let recommendedProduct_Price = 0;
    let recommendedCoins = 0;
    var Product_Price_Competitor1 = dataOfProducts.Competitor1;
  var Product_Price_Competitor2 = dataOfProducts.Competitor2;
  var Product_Price_Competitor3 = dataOfProducts.Competitor3;
  
  // Find the maximum value among the Product_Prices, considering undefined values
  let Best_Product_Price_Excluding_Store = Math.max(
      Product_Price_Competitor1 !== undefined ? Product_Price_Competitor1 : 0,
      Product_Price_Competitor2 !== undefined ? Product_Price_Competitor2 : 0,
      Product_Price_Competitor3 !== undefined ? Product_Price_Competitor3 : 0
  );
  console.log(Best_Product_Price_Excluding_Store);
    db.collection('Inventory')
    .where('Product_ID', '==', id)
    .get()
    .then((collectionsnap) => {
        let averageInventoryValue = 0;
       
        if (!collectionsnap.empty) {
            let totalProduct_Price = 0;
            let itemNumber = 0;
  
            collectionsnap.forEach((doc) => {
                const data = doc.data();
                totalProduct_Price += data.Product_Price_Live[0];
                itemNumber++;
            });
  console.log("two ");
            averageInventoryValue = totalProduct_Price / itemNumber;
           
        }
      
       
        let thresholdPercentChange = 0;
        let cannotRecommendProduct_Price = false;
  
        const LiveBuyExcludingStore2 = [
            dataOfProducts.Competitor2,
            dataOfProducts.Competitor3,
            dataOfProducts.Competitor1
        ];
  
        const LiveOpenExcludingStore2 = [
            dataOfProducts.In_Stock_Competitor1,
            dataOfProducts.In_Stock_Competitor2,
            true
        ];
  
        const LiveBuyExcludingStoreAmazon2 = [
            dataOfProducts.Competitor2,
            dataOfProducts.Competitor3,
        ];
  
        const LiveOpenExcludingStoreAmazon2 = [
            dataOfProducts.In_Stock_Competitor1,
            dataOfProducts.In_Stock_Competitor2
        ];
  

  var roundOffFactor = 0;
  var amazonPercent = 20;
  var lessProduct_Price = 0;
  var gross = 0;
  var minimumMargin = 0;
  let extraOffer = 0;
  let extraWalletCoins = 0;
  let bestCoinsExcludingStore=0;
  var reductionPercentIfOnlyStoreOffers = 0;
  var creditDifferenceBetweenBest = 0;
  var extraCoinsFromBest = 0;

  if (dataOfProducts.Condition === "Condition_1") {
      
      switch (dataOfProducts.Category_ID) {
          case "C1":
              roundOffFactor = 200;
              creditDifferenceBetweenBest = 400;
              dataOfProducts.Competitor1 = 0;
              extraCoinsFromBest = 300;
              switch (true) {
                  case Best_Product_Price_Excluding_Store >= 0 && Best_Product_Price_Excluding_Store <= 2999:
                      extraOffer = 200;
                      extraWalletCoins = 400;
                      thresholdPercentChange = 20;
                      break;
                      
                  // more cases can be added according to one's need
              }
              break;
      case "C2":
      case "C3":
          roundOffFactor = 40;
          reductionPercentIfOnlyStoreOffers = 40;
          creditDifferenceBetweenBest = 300;
          extraCoinsFromBest = 100;
    
          switch (true) {
              case dataOfProducts.Competitor1 >= 1 && dataOfProducts.Competitor1 <= 1999:
                  amazonPercent = 20; // this data is according to specific industry change it according to your needs
                  break;
            
                                        
              // more cases can be added according to one's need
              default:
                  amazonPercent = 0;
          }
    
          switch (true) {
              case Best_Product_Price_Excluding_Store >= 0 && Best_Product_Price_Excluding_Store <= 1:
                  extraOffer = 100;
                  extraWalletCoins = 100;
                  thresholdPercentChange = 100;
                  break;
                             
              // more cases can be added according to one's need
              default:
                  extraOffer = 50;
                  extraWalletCoins = 300;
                  thresholdPercentChange = 50;
          }
          extraCoinsFromBest = extraOffer;
          break;
    
          case "C4":
              roundOffFactor = 50;
              extraCoinsFromBest = 50;
              reductionPercentIfOnlyStoreOffers = 30;
              creditDifferenceBetweenBest = 200;
              // Add logic for other cases
              switch (true) {
              case dataOfProducts.Competitor1 >= 1 && dataOfProducts.Competitor1 <= 1999:
                  amazonPercent = 70;
                  break;
             
      // more cases can be added according to one's need
              default:
                  amazonPercent = 0;
          }
    
          switch (true) {
              case Best_Product_Price_Excluding_Store >= 0 && Best_Product_Price_Excluding_Store <= 1:
                  extraOffer = 100;
                  extraWalletCoins = 100;
                  thresholdPercentChange = 100;
                  break;
                             
              // Add more cases for other ranges if needed
              default:
                  extraOffer = 50;
                  extraWalletCoins = 500;
                  thresholdPercentChange = 50;
          }
              break;
          default:
              cannotRecommendProduct_Price = true;
              break;
      }
     
      if(Best_Product_Price_Excluding_Store){
      recommendedProduct_Price = (Best_Product_Price_Excluding_Store !== 0) ? (Best_Product_Price_Excluding_Store + extraOffer) : 0;
      }
    
      var amazonPercentCondition_1Product_Price = 0;
      var newProduct_Price = 0;
      
      if (dataOfProducts.Competitor1 && dataOfProducts.Competitor1.toString() !== "0") {
          amazonPercentCondition_1Product_Price = Math.round((dataOfProducts.Competitor1 * amazonPercent / 100) / 100) * 100;
         
          if (recommendedProduct_Price > amazonPercentCondition_1Product_Price) {
              var sortedLive = LiveBuyExcludingStoreAmazon2.sort(function(a, b) {
                  return b - a;
              });
  
              for (var i = 0; i < sortedLive.length; i++) {
                  if (sortedLive[i] <= amazonPercentCondition_1Product_Price) {
                      newProduct_Price = sortedLive[i];
                      break;
                  }
              }
              recommendedProduct_Price = (newProduct_Price !== 0) ? (newProduct_Price + extraOffer) : amazonPercentCondition_1Product_Price;
          } else if (recommendedProduct_Price === 0) {
              recommendedProduct_Price = Math.round((dataOfProducts.Competitor1 * amazonPercent / 100 * (1 - reductionPercentIfOnlyStoreOffers * 0.01)) / 100) * 100;
          }
      }
      console.log(extraWalletCoins)
      recommendedProduct_Price = (recommendedProduct_Price <= 100) ? 100 : ((recommendedProduct_Price <= 150) ? 150 : ((recommendedProduct_Price <= 200) ? 200 : recommendedProduct_Price));
      recommendedCoins = recommendedProduct_Price + extraWalletCoins;
     
      if (bestCoinsExcludingStore >= recommendedCoins && (bestCoinsExcludingStore - recommendedCoins) <= creditDifferenceBetweenBest) {
          if (recommendedProduct_Price !== amazonPercentCondition_1Product_Price && newProduct_Price === 0) {
              recommendedCoins = bestCoinsExcludingStore + extraCoinsFromBest;
          }
      }
      console.log(recommendedCoins,recommendedProduct_Price)
      if (recommendedProduct_Price !== 0) {
          var percentChange = Math.abs((recommendedProduct_Price - dataOfProducts.Product_Price) * 100 / dataOfProducts.Product_Price);
          if (percentChange > thresholdPercentChange) {
              db.collection("Products")
                  .doc(dataOfProducts.Product_ID).set({
                      "Manual_Check": true
                  }, {
                      merge: true
                  }).then(dowhat=>{
                    return 0
                  });
              // recommendedProduct_PriceText.style.color = "#D92903";
          }else{
              db.collection("Products")
              .doc(dataOfProducts.Product_ID).set({
                  "Manual_Check": false,
                  "Product_Price": recommendedProduct_Price,
                  "Coins":recommendedCoins
              }, {
                  merge: true
              }).then(dowhat=>{
                return 0
              });
          }
        } else {
          db.collection("Products")
              .doc(dataOfProducts.Product_ID).set({
                  "Manual_Check": false,
                  "Cannot_Recommend_Product_Price": true
              }, {
                  merge: true
              }).then(dowhat=>{
                return 0
              });
        }
     
  }
  
  else if (dataOfProducts.Condition === "Condition_2") {
   
    var modifiedCondition_1Product_Price =
        (dataOfProducts.Condition_1_Product_Price.toString() === "0") ? averageInventoryValue : parseInt(dataOfProducts.Condition_1_Product_Price);
    var modifiedAverageInventoryValue =
        (averageInventoryValue.toString() === "0") ? parseInt(dataOfProducts.Condition_1_Product_Price) : averageInventoryValue;
  
    switch (dataOfProducts.Category_ID) {
        case "C1":
            minimumMargin = 3999;
            dataOfProducts.Competitor1 = 0;
            roundOffFactor = 100;
            switch (true) {
                case modifiedCondition_1Product_Price >= 1 && modifiedCondition_1Product_Price <= 2999:
                    lessProduct_Price = 250;
                    gross = 100;
                    thresholdPercentChange = 100;
                    break;
           
            }
            break;
        case "C2":
        case "C3":
            roundOffFactor = 50;
            switch (true) {
                case dataOfProducts.Competitor1 >= 1 && dataOfProducts.Competitor1 <= 249:
                    amazonPercent = 30;
                    break;
                case dataOfProducts.Competitor1 >= 250 && dataOfProducts.Competitor1 <= 499:
                    amazonPercent = 30;
                    break;
              
                default:
                    amazonPercent = 0;
            }
            switch (true) {
                case modifiedCondition_1Product_Price >= 0 && modifiedCondition_1Product_Price <= 299:
                    minimumMargin = 199;
                    lessProduct_Price = 50;
                    gross = 100;
                    thresholdPercentChange = 100;
                    break;
              
            
            }
            break;
        case "C4":
            roundOffFactor = 50;
            switch (true) {
                case dataOfProducts.Competitor1 >= 1 && dataOfProducts.Competitor1 <= 1999:
                    amazonPercent = 30;
                    break;
              
                default:
                    amazonPercent = 0;
            }
            switch (true) {
                case modifiedCondition_1Product_Price >= 0 && modifiedCondition_1Product_Price <= 4999:
                    minimumMargin = 499;
                    lessProduct_Price = 200;
                    gross = 35;
                    thresholdPercentChange = 50;
                    break;
            
            }
            break;
        default:
            cannotRecommendProduct_Price = true;
            break;
    }
  
  
  
    var minimum = 100000000;
    for (var i = 0; i < LiveOpenExcludingStoreAmazon2.length; i++) {
      if (LiveOpenExcludingStoreAmazon2[i] && LiveBuyExcludingStoreAmazon2[i].toString() !== "0") {
          if (parseInt(LiveBuyExcludingStoreAmazon2[i]) <= minimum && parseInt(LiveBuyExcludingStoreAmazon2[i]) - modifiedAverageInventoryValue >= minimumMargin) {
              minimum = parseInt(LiveBuyExcludingStoreAmazon2[i]);
          }
      }
    }
    
    var bestOpenProduct_PriceAboveMinimumMargin = (minimum !== 100000000) ? minimum : 0;
    var ifAllClosedBestProduct_Price = 0;
    var allOff = !LiveOpenExcludingStoreAmazon2.includes(true);
    if (allOff) {
      var minimum2 = 100000000;
      for (var j = 0; j < LiveOpenExcludingStore2.length; j++) {
          if (LiveBuyExcludingStore2[j] !== undefined && LiveBuyExcludingStore2[j].toString() !== "0") {
              if (parseInt(LiveBuyExcludingStore2[j]) <= minimum2) {
                  minimum2 = parseInt(LiveBuyExcludingStore2[j]);
              }
          }
      }
      ifAllClosedBestProduct_Price = (minimum2 !== 100000000) ? minimum2 : 0;
    }
    
    if (bestOpenProduct_PriceAboveMinimumMargin !== 0) {
      recommendedProduct_Price = (bestOpenProduct_PriceAboveMinimumMargin - lessProduct_Price);
    } else {
      var grossProduct_Price = parseInt(modifiedCondition_1Product_Price * (1 + gross * 0.01));
      if (ifAllClosedBestProduct_Price !== 0) {
          recommendedProduct_Price = ifAllClosedBestProduct_Price;
      }
      if (recommendedProduct_Price <= grossProduct_Price) {
          recommendedProduct_Price = grossProduct_Price;
      }
    }
    var amazonSuggestedBuyProduct_Price1 = Math.round(((dataOfProducts.Competitor1 * amazonPercent / 100) / 10)) * 10;
    var amazonSuggestedBuyProduct_Price2 = Math.round(((dataOfProducts.Competitor1 * (amazonPercent - 10) / 100) / 10)) * 10;
    var amazonSuggestedBuyProduct_Price3 = Math.round(((dataOfProducts.Competitor1 * (amazonPercent - 20) / 100) / 10)) * 10;
    
    if (dataOfProducts && dataOfProducts.Competitor1 !== undefined && dataOfProducts.Competitor1.toString() !== "0") {
      if (recommendedProduct_Price > amazonSuggestedBuyProduct_Price1 || recommendedProduct_Price === 0) {
          recommendedProduct_Price = amazonSuggestedBuyProduct_Price1;
      }
    }
    
    if (recommendedProduct_Price - modifiedAverageInventoryValue < minimumMargin) {
      if (recommendedProduct_Price + lessProduct_Price - modifiedAverageInventoryValue >= minimumMargin) {
          recommendedProduct_Price += lessProduct_Price;
      } else {
          recommendedProduct_Price = (dataOfProducts && dataOfProducts.Competitor1 !== undefined && dataOfProducts.Competitor1.toString() !== "0") ?
              ((recommendedProduct_Price < amazonSuggestedBuyProduct_Price1 && (amazonSuggestedBuyProduct_Price1 - modifiedAverageInventoryValue > minimumMargin)) ?
                  ((recommendedProduct_Price < amazonSuggestedBuyProduct_Price2 && (amazonSuggestedBuyProduct_Price2 - modifiedAverageInventoryValue > minimumMargin)) ?
                      amazonSuggestedBuyProduct_Price3 : amazonSuggestedBuyProduct_Price2) : amazonSuggestedBuyProduct_Price1) :
              (Math.max(averageInventoryValue, parseInt(dataOfProducts.Condition_1_Product_Price)) + minimumMargin);
      }
    }
    recommendedProduct_Price = Math.round((recommendedProduct_Price / roundOffFactor)) * roundOffFactor - 1;
    
    if (modifiedCondition_1Product_Price === 0) {
      recommendedProduct_Price = 0;
    }
    
  
    
    if (cannotRecommendProduct_Price) {
      recommendedProduct_Price = 0;
      
    }
    
    if (recommendedProduct_Price !== 0) {
      var percentChange = Math.abs((recommendedProduct_Price - dataOfProducts.Product_Price) * 100 / dataOfProducts.Product_Price);
      if (percentChange > thresholdPercentChange) {
          db.collection("Products")
              .doc(dataOfProducts.Product_ID).set({
                  "Manual_Check": true
              }, {
                  merge: true
              }).then(dowhat=>{
                return 0
              });
        
      }else{
          db.collection("Products")
          .doc(dataOfProducts.Product_ID).set({
              "Manual_Check": false,
              "Product_Price": recommendedProduct_Price
          }, {
              merge: true
          }).then(dowhat=>{
            return 0
          });
      }
    } else {
      db.collection("Products")
          .doc(dataOfProducts.Product_ID).set({
              "Manual_Check": false,
              "Cannot_Recommend_Product_Price": true
          }, {
              merge: true
          }).then(dowhat=>{
            return 0
          });
    }
  
  
  
  
    console.log("Product_Price=",recommendedProduct_Price)
  
 
  }
  else
  {
  cannotRecommendProduct_Price = true;
  return 0;
  }
  
  
  // console.log(recommendedCoins);
  });
    
    } catch (error) {
    console.error("Error:", error);
    }
  };


  async function manageInventory(dataOfProducts){
    var recommendedProduct_Price = 0;
    var recommendedCoins = 0;
    var Product_Price_Competitor1 = dataOfProducts.Competitor1;
  var Product_Price_Competitor2 = dataOfProducts.Competitor2;
  var Product_Price_Competitor3 = dataOfProducts.Competitor3;
  
  // Find the maximum value among the Product_Prices, considering undefined values

  let min_Product_Price_Excluding_Store=Math.min(
    Product_Price_Competitor1 !== undefined ? Product_Price_Competitor1 : Infinity,
    Product_Price_Competitor2 !== undefined ? Product_Price_Competitor2 : Infinity,
    Product_Price_Competitor3 !== undefined ? Product_Price_Competitor3 : Infinity
);
    if(dataOfProducts.Condition == "Condition_1"){
     recommendedProduct_Price=min_Product_Price_Excluding_Store - 50
     recommendedCoins=recommendedProduct_Price+50
     if(min_Product_Price_Excluding_Store != Product_Price_Competitor1 && min_Product_Price_Excluding_Store != Infinity && recommendedProduct_Price >=0){
        // here update the Product_Price
        db.collection("Products")
       .doc(dataOfProducts.Product_ID).set({
            "Manual_Check": false,
            "Product_Price": recommendedProduct_Price,
            "Coins":recommendedCoins
        }, {
            merge: true
        }).then(dowhat=>{
          return 0
        });



     }

    }else if(dataOfProducts.Condition == "Condition_2"){
        var Product_PriceLive=[]
        if(dataOfProducts.In_Stock_Competitor1){
            Product_PriceLive.push(Product_Price_Competitor2)
        }
        if(dataOfProducts.In_Stock_Competitor2){
            Product_PriceLive.push(Product_Price_Competitor3)
        }
        let min_Product_Price_Excluding=Math.min(
            ...Product_PriceLive 
           
        );
        recommendedProduct_Price=min_Product_Price_Excluding - 50
       
     if(min_Product_Price_Excluding != Product_Price_Competitor1 && min_Product_Price_Excluding != Infinity && min_Product_Price_Excluding >= 0){
        // here update the Product_Price
        db.collection("Products")
        .doc(dataOfProducts.Product_ID).set({
            "Manual_Check": false,
            "Product_Price": recommendedProduct_Price,
        }, {
            merge: true
        }).then(dowhat=>{
          return 0
        });
     }


    }



  }




app.get('/AverageStockProduct_Price',async(req,res)=>{
  db.collection("Products/").where("Condition","==","Condition_2").where("Condition_1_Product_Price_IDs","!=","").get().then(querysnap=>{
    console.log(querysnap.docs.length)
     querysnap.docs.forEach(doc=>{

let Condition_1docid=doc.data().Condition_1_Product_Price_IDs
console.log(doc.data().Condition_1_Product_Price_IDs)
  db.collection("LEDGER").where("Product_ID","==",Condition_1docid).where("Last_Entry","in",["Purchase","Return","RTO","Return Good"]).get().then(async ledgersnap=>{
    console.log(ledgersnap.docs.length)
     var Product_Price=0
     var length=ledgersnap.docs.length
    ledgersnap.docs.forEach(ledgerdoc=>{
         let data=ledgerdoc.data()
         // console.log(data["Product_Price_Live"])
         let Product_PriceLive=data["Product_Price_Live"].length
         // console.log(data["Product_Price_Live"][Product_PriceLive - 1])
         Product_Price=Product_Price+data["Product_Price_Live"][Product_PriceLive - 1]

     })
     var averageProduct_Price=Product_Price
     if(length != 0){
     averageProduct_Price=parseInt(Product_Price/length)
     }
    db.collection("Products").doc(doc.id).set({"Average_Inventory_Value":averageProduct_Price},{merge:true})
    db.collection("Products").doc(Condition_1docid).set({"Stocks":length},{merge:true})
     console.log(averageProduct_Price)
  })



})
 })
})


app.get('/Competitor2Content/:entitycode',async(req,res)=>{
  const datetoday= new Date(new Date().getTime());
  const entitycode= req.params.entitycode
  const dd = String(datetoday.getDate()).padStart(2, "0");
  const mm = String(datetoday.getMonth() + 1).padStart(2, "0"); //January is 0!
  const yyyy = datetoday.getFullYear();
  const today1 = dd + "-" + mm + "-" + yyyy;
  var promise=[]
      await db.collection("Products").where("Live","==",true).where("Category_ID","==",entitycode).where("Link_Competitor2", ">=", "https")
      .where("Link_Competitor2", "<", "httpt").get().then(querysnap=>{
        querysnap.docs.forEach(async doc=>{
          console.log(today1)
          var link=doc.data().Link_Competitor2
       
          var Product_Price_Competitor3=0
          var Competitor2credtis=0
    
          var Competitor2stock=true
         
          var condition=doc.data().Condition
          if(link == undefined){
              link="NA"
          }
          
          if(condition != "Condition_1"){
            if(link != undefined){
              if(link.includes("https")){
       request(link,async function(res,err,html){
      
      if(typeof(html) == "string"){
        const $ = cheerio.load(html);
       
        const Product_PriceElement = $('#ProductProduct_Price');
        
        const stockAvailability = $('.stock-left .text-danger').text();
       
        if(stockAvailability == "Out Of Stock"){
          Competitor2stock=false
        }
        // Extract the Product_Price value
        const Product_Price = Product_PriceElement.text().trim();
       
        console.log("Product_Price:", Product_Price);
        Product_Price_Competitor3=parseInt(Product_Price)
      }
        
            if(Product_Price_Competitor3 != 0  ){
               if(!isNaN(Product_Price_Competitor3)){
                console.log(link)
                const k=await db.collection("Products").doc(doc.id).set({"Competitor3":Product_Price_Competitor3,"In_Stock_Competitor2":Competitor2stock,"Last_Updated_Competitor2":today1},{merge:true})
                 promise.push(k)
              }
              }
      
                })
        
             
                
              }}
            
            }else{
              if(link.includes("https")){
                request(link,async function(res,err,html){
                 
                         if(typeof(html) == "string"){
                          
                           const $ = cheerio.load(html);
               
                console.log(link)
                
                const Product_PriceElement = $('.btn-content');
                
                // Extract the Product_Price value
                const Product_PriceText = Product_PriceElement.text();
                const Product_Price = Product_PriceText.match(/₹ (\d+)/);
               
                if (Product_Price) {
                  console.log("Product_Price Cash:", Product_Price[1]);
                  Product_Price_Competitor3=parseInt(Product_Price[1]);
                 
                } else {
                 
                  console.log("Product_Price not found");
                }
                const buttonElement = $('.Condition_1-page.btn-Coins');
                
                // Get the element within the button that contains the Product_Price
                const Product_PriceElement2 = buttonElement.find('.btn-content');
                
                // Extract the Product_Price value
                const Product_PriceText2 = Product_PriceElement2.text();
                const Product_Price2 = Product_PriceText2.match(/(\d+)/);
                
                if (Product_Price2) {
                  console.log("Product_Price Coins:", Product_Price2[0]);
                  Competitor2credtis=parseInt(Product_Price2)
                 
                } else {
               
                  console.log("Product_Price not found");
                }
                         }
                  
                     
             
                     
                      
                           if(  Product_Price_Competitor3 != 0 && Competitor2credtis != 0 && !isNaN(Product_Price_Competitor3) && !isNaN(Competitor2credtis)){
                             const k= await db.collection("Products").doc(doc.id).set({"Competitor2_Coins":Competitor2credtis,"Competitor3":Product_Price_Competitor3,"Last_Updated_Competitor2":today1},{merge:true})
                              promise.push(k)
                              console.log(link)
                             console.log("Condition 2")
                           }
                    
             
                                   })
                                  
                  
                     
                     }
    
    
            }
    
            
            })
      })
  
  
     
        
})

app.get('/Competitor3Content/:entitycode',async(req,res)=>{
  const datetoday= new Date(new Date().getTime());
  const dd = String(datetoday.getDate()).padStart(2, "0");
  const entitycode= req.params.entitycode
  const mm = String(datetoday.getMonth() + 1).padStart(2, "0"); //January is 0!
  const yyyy = datetoday.getFullYear();
  const today1 = dd + "-" + mm + "-" + yyyy;
  var promise=[]
  await db.collection("Products").where("Live","==",true).where("Category_ID","==",entitycode).where("Link_Competitor3", ">=", "https")
  .where("Link_Competitor3", "<", "httpt").get().then(querysnap=>{
    querysnap.docs.forEach(async doc=>{
      console.log(today1)
    
      var Competitor3link=doc.data().Link_Competitor3
     
      var Product_Price_Competitor2=0
      var Competitor3Coins=0
      
      var Competitor3stock=true
      var condition=doc.data().Condition
      
      if(Competitor3link == undefined){
        Competitor3link="NA"
      }
      if(condition != "Condition_1"){
        
          if(Competitor3link.includes("https")){
            request(Competitor3link,async function(res,err,html){
              if(typeof(html) == "string"){
                const $ = cheerio.load(html);
	   

                // Get the ins element that contains the discounted Product_Price
                const insElement = $('.Product_Pricebox ins');
              
                // Extract the Product_Price value from the ins element
                const Product_PriceText = insElement.text().trim();
                const Product_PriceMatch = Product_PriceText.match(/Rs\.\s*([\d,]+)/);
                const stockelement= $('.stock');
                const stocktext=stockelement.text().trim()
                
                
                if(stocktext != "IN STOCK"){
                Competitor3stock=false
                }
                if (Product_PriceMatch) {
                  console.log(Product_PriceMatch);
                  const Product_PriceValue = Product_PriceMatch[1].replace(',', ''); // Remove commas from the number
                
                 Product_Price_Competitor2=parseInt(Product_PriceValue)
                 console.log(Product_Price_Competitor2);
                } else {
                  const insElement = $('.woocommerce-Product_Price-amount.amount');
                            
                  // Extract the Product_Price value from the ins element
                  const Product_PriceText = insElement.text().trim();
                  const Product_PriceMatch = Product_PriceText.match(/Rs\.\s*([\d,]+)/);
                  const stockelement= $('.stock');
                  const stocktext=stockelement.text().trim()
                   
                  console.log(stockelement.text().trim())
                  if(stocktext != "IN STOCK"){
                  Competitor3stock=false
                  }
                  if (Product_PriceMatch) {
                    const Product_PriceValue = Product_PriceMatch[1].replace(',', ''); // Remove commas from the number
                    console.log("Product_Price:", Product_PriceValue);
                   Product_Price_Competitor2=parseInt(Product_PriceValue)
                  } else {
                  Product_Price_Competitor2=0
                    console.log("Product_Price not found");
                  }
            
            
                }
              }
              
              
        
  
  
              if(( Product_Price_Competitor2 != 0) ){
                if( !isNaN(Product_Price_Competitor2) ){
                  const k= await db.collection("Products").doc(doc.id).set({"Competitor2":Product_Price_Competitor2,"In_Stock_Competitor1":Competitor3stock,"Last_Updated_Competitor3":today1},{merge:true})
                   promise.push(k)
                   console.log(Competitor3link)
                }
                } 
                        })
          }
       
  
  
  
      }else{
       
          if(Competitor3link.includes("https")){
            request(Competitor3link,async function(res,err,html){
              if(typeof(html) == "string"){
                const $ = cheerio.load(html);
                
            console.log(Competitor3link)
                // Get the span element that contains the Product_Price
                const Product_PriceElements = $('.woocommerce-Product_Price-amount.amount');
               
                Product_PriceElements.each(async (index, element) => {
                  const Product_PriceText = $(element).text().trim();
                  const Product_PriceMatch = Product_PriceText.match(/Rs\.\s*([\d,]+)/);
                  
                  if (Product_PriceMatch) {
                    const Product_PriceValue = Product_PriceMatch[1].replace(',', ''); // Remove commas from the number
                    
                    console.log(`Product_Price ${index + 1}:`, Product_PriceValue);
                    if(index == 0){
                      Product_Price_Competitor2=parseInt(Product_PriceValue)
                    }
                    if(index == 1){
                      Competitor3Coins =parseInt(Product_PriceValue)
                    }
                  } else {
                   
                    console.log(`Product_Price ${index + 1}: Product_Price not found`);
                  }
                 
          
                })
              }
      
  
  
              if(Competitor3Coins != 0 && Product_Price_Competitor2 != 0 && !isNaN(Competitor3Coins) && !isNaN(Product_Price_Competitor2) ){
                const k=await db.collection("Products").doc(doc.id).set({"Competitor2":Product_Price_Competitor2,"Competitor3_Coins":Competitor3Coins,"Last_Updated_Competitor3":today1},{merge:true})
                 promise.push(k)
                 console.log(Competitor3link)
                console.log("Condition 1")
              }
                  })
          }
        
  
      
      
      }
    
      
  
  
 
  
    })
  })
})



app.get('/SetCondition_1Product_Price/:entitycode',async(req,res)=>{

const entitycode=req.params.entitycode
if(entitycode == "C2" || entitycode == "C3" || entitycode == "C1" ){
  db.collection("Products").where("Category_ID","==",entitycode).where("Live", "==",true).where("Condition","==","Condition_1").get().then(
    querysnap=>{
    querysnap.docs.forEach(doc=>{
        

      let data=doc.data()
      var sync=data.Do_Not_Sync
      var Stocks=data.Stocks
        if(sync == undefined){
         sync=false
        }
        if(!sync ){
            if(Stocks<6){
                update(data)
            }else{
                manageInventory(data)
            }
            
        }
        
     
    })
 })
}

})
app.get('/SetPreOwnedProduct_Price/:entitycode',async(req,res)=>{

  const entitycode=req.params.entitycode
  if(entitycode == "C2" || entitycode == "C3" || entitycode == "C1" ){
    db.collection("Products").where("Category_ID","==",entitycode).where("Live", "==",true).where("Condition","==","Condition_2").get().then(
      querysnap=>{
      querysnap.docs.forEach(doc=>{
  
        
        let data=doc.data()
        var sync=data.Do_Not_Sync
        if(sync == undefined){
         sync=false
        }
        if(!sync){
            if(data.Condition_1_Product_Price_IDs != undefined && data.Condition_1_Product_Price != undefined){
                if(data.Stocks <9){
                    update(data)
                }else{
                    manageInventory(data)
                }
               
            }
        }
        
       
      })
   })
  }
  
  })



  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
  });