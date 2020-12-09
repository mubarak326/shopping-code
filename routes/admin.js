var express = require('express');
var router = express.Router();
var productHelper=require('../helper/producthelper')

/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelper.getallproducts().then((products)=>{
    console.log(products)
    res.render('admin/viewproduct',{products,admin:true});
  }) 

 
});
  router.get('/addproduct',(req,res)=>{
      res.render('admin/addproduct')
  })
  router.post('/addproduct',(req,res)=>{
    console.log(req.body)
    console.log(req.files.Image)
    productHelper. productadd(req.body,(id)=>
    {
       var image=req.files.Image
       image.mv('./public/product-image/'+id+'.jpg',(err,done)=>{
         if(!err)
         {
          res.render("admin/addproduct")
         }
       })
    
      
      })
     
    }) 
    router.get('/deleteproduct/:id',(req,res)=>{
      var prodId=req.params.id
      console.log(prodId)
      productHelper.deleteProduct(prodId).then((response)=>{
        res.redirect('/admin/')
      })
    })

    router.get('/editproduct/:id',async (req,res)=>{
      var product=await productHelper.getproductdetail(req.params.id)
      console.log(product)
      res.render('admin/editproduct',{product})
    })
    router.post('/editproduct/:id',(req,res)=>{
      var id=req.params.id
      productHelper.update(req.params.id,req.body).then(()=>{
        res.redirect('/admin')
        if(req.files.Image)
        {
          var image=req.files.Image
          image.mv('./public/product-image/'+id+'.jpg')
        }
      })
    })
  


module.exports = router;
