var express = require('express');
var router = express.Router();
var productHelper=require('../helper/producthelper');
const userhelper = require('../helper/userhelper');
var userHelper=require('../helper/userhelper')
var verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn)
  {
    next()
  }else{
    res.redirect('/login')
  }
}
/* GET home page. */
router.get('/', async function(req, res, next) {
  var user=req.session.user
  console.log(user)
 var cartcount=null
  if(req.session.user)
  {
    cartcount=await userHelper.getcartcount(req.session.user._id)
  }
  productHelper.getallproducts().then((products)=>{
    
    res.render('user/viewproduct',{products,user,cartcount});
  })
 
});
router.get('/login',(req,res)=>{
  if(req.session.loggedIn)
  {
    res.redirect('/')
  }else{
      res.render('user/login',{"loginErr":req.session.loginErr})
  req.session.loginErr=false
}

})
router.get('/signup',(req,res)=>{
  res.render('user/signup')
})
router.post('/signup',(req,res)=>{
  userHelper.dosignup(req.body).then((response)=>{
       console.log(response);
       req.session.loggedIn=true
       req.session.user=response
       res.redirect('/')
  }) 
})
router.post("/login",(req,res)=>{
  userHelper.dologin(req.body).then((response)=>{
    if(response.status)
    {
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/')
    }else{
      req.session.loginErr="invalid username or password"
      res.redirect('/login')
    }
    
  })
})
  router.get('/logout',(req,res)=>{
    req.session.destroy()
    res.redirect('/')
  })
  router.get('/cart',verifyLogin,async(req,res)=>{
   var products=await userHelper.getproductscart(req.session.user._id)
   let totalvalue=0
   if(products.length>0){
     totalvalue=await userHelper.gettotalAmount(req.session.user._id)
   }
   
    console.log(products)
    res.render('user/cart',{products,user:req.session.user,totalvalue})
  })

  router.get('/addtocart/:id',(req,res)=>{
    
     userHelper.Addtocart(req.params.id,req.session.user._id).then(()=>{
      res.json({status:true})
    })  
  })
  
  router.post('/change-quantity',(req,res,next)=>{
    console.log(req.body)
     userHelper.ChangeQuantity(req.body).then(async(response)=>{
       response.total=await userHelper.gettotalAmount(req.body.user)
        res.json(response)
    })
  })
  router.get('/continue-pay',verifyLogin,async(req,res)=>{
    var total=await userHelper.gettotalAmount(req.session.user._id)
    res.render('user/address',{total,user:req.session.user})
  })
  router.post('/continue-pay',async(req,res)=>{
    var products=await userHelper.getcartproductlist(req.body.userId)
    var totalprice=await userHelper.gettotalAmount(req.body.userId)
    userHelper.placeorder(req.body,products,totalprice).then((orderId)=>{
      if(req.body['payment-method']==='COD')
      {
      res.json({codsuccess:true})
    }else{
      userHelper.generateRazorpay(orderId,totalprice).then((response)=>{
        res.json(response)
      })
    }

    })
    
    console.log(req.body)
  })
  router.get('/checkout',(req,res)=>{
    res.render('user/checkout',{user:req.session.user})
  })
  router.get('/order',async(req,res)=>{
    var orders=await userHelper.getuserorders(req.session.user._id)
     res.render('user/order',{user:req.session.user,orders})
  })
  router.get('/view-orderproducts/:id',async(req,res)=>{
    let products=await userHelper.getorderproducts(req.params.id)
    res.render('user/view-orderproducts',{user:req.session.user,products})
  })
  router.post('/verify-payment',(req,res)=>{
    console.log(req.body);
    userHelper.verifypayment(req.body).then(()=>{
      userHelper.changepaymentstatus(req.body['order[receipt]']).then(()=>{
        console.log("payment successfull")
        res.json({status:true})
      })
    }).catch((err)=>{
      console.log(err)
      res.json({status:false})
    })
    

  })
 

module.exports = router;
