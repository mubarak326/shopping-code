function addtoCart(proId)
{
    $.ajax({
        url:'/addtocart/'+proId,
        method:'get',
        success:(response)=>{
           
         if(response.status)
         {
             var count=$('#cart-count').html()
             count=parseInt(count)+1
             $('#cart-count').html(count)
         }
         alert(response)
        }
    })
}