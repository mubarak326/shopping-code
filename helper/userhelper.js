var db=require('../config/connection')
var collection=require('../config/collection')
var bcrypt=require('bcrypt')
var objectId=require('mongodb').ObjectID
const Razorpay=require('razorpay')
var instance = new Razorpay({
    key_id: 'rzp_test_oZu3J0UoD89c4G',
    key_secret: 'X9SM5w7wX2SsaZ4w5jApKjU7',
  });
module.exports={
    dosignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Password=await bcrypt.hash(userData.Password,10)
            
            db.get().collection(collection.user_collection).insertOne(userData).then((data)=>{
                resolve(data.ops[0])
            })
        })
    },
    dologin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            var loginStatus=false
            var response={}
            var user=await db.get().collection(collection.user_collection).findOne({Email:userData.Email})
            if(user)
            {
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if(status)
                    {
                        console.log("login success")
                        response.user=user
                        response.status=true
                        resolve(response)
                    }else{
                        console.log("login failed")
                        resolve({status:false})
                    }
                  
                    
                })
            }else{
                console.log("login failed")
                resolve({status:false})
            }
        })
    },
    Addtocart:(proId,userId)=>
    {
        var proObj={
            item:objectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            var userCart=await db.get().collection(collection.cart_collection).findOne({user:objectId(userId)})
            if(userCart)
            {
               var proExist=userCart.products.findIndex(Product=> Product.item==proId)
               console.log(proExist)
               if(proExist!=-1){
                  db.get().collection(collection.cart_collection).updateOne({user:objectId(userId),'products.item':objectId(proId)},
                   {
                      $inc:{'products.$.quantity':1}
                   }
                   ).then(()=>{
                       resolve()
                   })
               }
               else{

               db.get().collection(collection.cart_collection).updateOne({user:objectId(userId)},
                {
                    $push:{products:proObj}
                }
                ).then((response)=>{
                    resolve()
                })
            }

            }else{
                var cartObj={
                    user:objectId(userId),
                    products:[proObj]
                }
                db.get().collection(collection.cart_collection).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })
    },

    getproductscart:(userId)=>{
      return new Promise(async(resolve,reject)=>{
        var cartItems=await db.get().collection(collection.cart_collection).aggregate([
             {
                  $match:{user:objectId(userId)}
              },
              {
                  $unwind:'$products'
              },
              {
                  $project:{
                      item:'$products.item',
                      quantity:'$products.quantity'
                  }
              },
              {
                  $lookup:{
                      from:collection.product_collection,
                      localField:'item',
                      foreignField:'_id',
                      as:'product'
                  }
              },
              {
                  $project:{
                      item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                  }
              },
             
           ]).toArray()
          
           resolve(cartItems)
       }) 
    },

    getcartcount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            var count=0
            var cart=await db.get().collection(collection.cart_collection).findOne({user:objectId(userId)})
            if(cart)
            {
                count=cart.products.length
               
            }
            resolve(count)
        })
    },
    ChangeQuantity:(details)=>{
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)
        return new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1)
            {
                db.get().collection(collection.cart_collection).updateOne({_id:objectId(details.cart)},
                {
                    $pull:{products:{item:objectId(details.product)}}
                }
                ).then((response)=>{
                    resolve({removeproduct:true})
                })
            }else{
            db.get().collection(collection.cart_collection).updateOne({_id:objectId(details.cart), 'products.item':objectId(details.product)},
            {
               $inc:{'products.$.quantity':details.count}
            }
            ).then((response)=>{
                resolve({status:true})
            })
        }
        })
    },
    gettotalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            var total=await db.get().collection(collection.cart_collection).aggregate([
                 {
                      $match:{user:objectId(userId)}
                  },
                  {
                      $unwind:'$products'
                  },
                  {
                      $project:{
                          item:'$products.item',
                          quantity:'$products.quantity'
                      }
                  },
                  {
                      $lookup:{
                          from:collection.product_collection,
                          localField:'item',
                          foreignField:'_id',
                          as:'product'
                      }
                  },
                  {
                      $project:{
                          item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                      }
                  },
                  {
                      $group:{
                          _id:null,
                          total:{$sum:{$multiply:[{$toInt:'$quantity'},{$toInt:'$product.Price'}]}}

                      }
                  }
                 
               ]).toArray()
               console.log(total[0].total)
              
               resolve(total[0].total)
           }) 

    },
    placeorder:(order,products,total)=>{
        return new Promise((resolve,reject)=>{
            console.log(order,products,total)
            var status=order['payment-method']==='COD'?'placed':'pending'
            var orderobj={
                deliverydetails:{
                    mobile:order.mobile,
                    address:order.address,
                    pincode:order.pincode
                },
                userId:objectId(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                totalamount:total,
                status:status,
                date:new Date()
               
                }
                db.get().collection(collection.order_collection).insertOne(orderobj).then((response)=>{
                    db.get().collection(collection.cart_collection).removeOne({user:objectId(order.userId)})
                        resolve(response.ops[0]._id)
                    })
                   

                })
            
        },
    getcartproductlist:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            var cart=await db.get().collection(collection.cart_collection).findOne({user:objectId(userId)})
            console.log(cart)
            resolve(cart.products)
        })
    },
   getuserorders:(userId)=>{
     return new Promise(async(resolve,reject)=>{
         console.log(userId)
         let orders=await db.get().collection(collection.order_collection).find({userId:objectId(userId)}).toArray()
         console.log(orders)
         resolve(orders)
     })
   } ,
   getorderproducts:(orderId)=>{
       return new Promise(async(resolve,reject)=>{
           let orderItems=await db.get().collection(collection.order_collection).aggregate([
            {
                 $match:{_id:objectId(orderId)}
             },
             {
                 $unwind:'$products'
             },
             {
                 $project:{
                     item:'$products.item',
                     quantity:'$products.quantity'
                 }
             },
             {
                 $lookup:{
                     from:collection.product_collection,
                     localField:'item',
                     foreignField:'_id',
                     as:'product'
                 }
             },
             {
                 $project:{
                     item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                 }
             },
            
          ]).toArray()
         
          resolve(orderItems)
       })

   },
   generateRazorpay:(orderId,total)=>{
       return new Promise((resolve,reject)=>{
        var options = {
            amount: total*100,  // amount in the smallest currency unit
            currency: "INR",
            receipt: "order"+orderId
          };
          instance.orders.create(options, function(err, order) {
            console.log("new order:",order);
            resolve(order)
          });
       })

   },
   verifypayment:(details)=>
   {
       return new Promise((resolve,reject)=>{
        let crypto = require('crypto'); 
        let hmac = crypto.createHmac('sha256', 'X9SM5w7wX2SsaZ4w5jApKjU7');
        hmac.update(details['payment[razorpay_order_id]']+"|"+details['payment[razorpay_payment_id]']);
        hmac=hmac.digest('hex')
        if(hmac==details['payment[razorpay_signature]']){
            resolve()
        } else{
            reject()
        }
       })

   },
   changepaymentstatus:(orderId)=>{
       return new Promise((resolve,reject)=>{
           db.get().collection(collection.order_collection)
           .updateOne({_id:objectId(orderId)},
           {
               $set:{
                   status:'placed'
               }
           }).then(()=>{
               resolve()
           })
       })

   }



}
   //deleteProduct:(details)=>{
          //  db.get().collection(collection.cart_collection).removeOne({_id:objectId(details.cart)},
            //{
              //  $pull:{products:{item:objectId(details.product)}}
            //}
            //).then((response)=>{
              // resolve(true)
            //})
        //})

    //}


