var db=require('../config/connection')
var collection=require('../config/collection')
var objectId=require('mongodb').ObjectID
module.exports={

    productadd:(item,callback)=>{
        console.log(item);


    db.get().collection('item').insertOne(item).then((data)=>{
        console.log(data)
            callback(data.ops[0]._id)
        })
    
    },
   
     getallproducts:()=>{
         return new Promise(async(resolve,reject)=>{
             var products=await db.get().collection(collection.product_collection).find().toArray()
             resolve(products)
         })
     },

     deleteProduct:(proId)=>{
         return new Promise((resolve,reject)=>{
          console.log(proId)
          console.log(objectId(proId))
            db.get().collection(collection.product_collection).removeOne({_id:objectId(proId)}).then((response)=>{
                resolve(response)
            })
         })

     },

     getproductdetail:(proId)=>{
         return new Promise((resolve,reject)=>{
             db.get().collection(collection.product_collection).findOne({_id:objectId(proId)}).then((product)=>{
                 resolve(product)
             })
         })
     },
     update:(proId,prodetails)=>{
         return new Promise((resolve,reject)=>{
             db.get().collection(collection.product_collection).updateOne({_id:objectId(proId)},{
                 $set:{
                     Name:prodetails.Name,
                     Product:prodetails.Product,
                     Price:prodetails.Price
                 }
             }).then((response)=>{
                 resolve()
             })
         })
     }
        
}