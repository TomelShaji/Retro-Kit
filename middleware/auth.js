const isLogin = async(req,res,next)=>{
    try {
        if(req.session.user_id){next()}
        else{
           return res.redirect('/landingPage')
        }
        
    } catch (error) {
        console.log(error.message);
    }
}

const isLogout = async(req,res,next)=>{
    try {
        if(req.session.user_id){
           return res.redirect('/home');
        }
        next();
    } catch (error) {
        console.log(error.message);
    }
}
// const isLogin = async (req, res, next) => {
//     try {
//         if (req.session.is_userId) {
//             next();
//         } else {
//             res.redirect('/landingPage');
//         }
//     } catch (error) {
//         console.log(error.message);
//     }
// };

// const isLogout = async (req, res, next) => {
//     try {
//         if (req.session.is_user) {
//             res.redirect('/home');
//         } else {
//             next();
//         }
//     } catch (error) {
//         console.log(error.message);
//     }
// };


module.exports = {
    isLogin,
    isLogout,
}