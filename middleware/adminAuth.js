// const islogin = async (req, res, next) => {
//     try {
//         if (req.session.is_admin) {
//             next();
//         } else {
//             res.redirect('/admin/login');
//         }
//     } catch (error) {
//         console.log(error.message);
//     }
// }

// const isLogout = async (req, res, next) => {
//     try {
//         if (req.session.is_admin) {
//             res.redirect('/admin/home');
//         }
//         next();
//     } catch (error) {
//         console.log(error.message);
//     }
// }

// module.exports = {
//     islogin,
//     isLogout
// };

const isLogin = async (req, res, next) => {
    try {
        if (req.session.is_admin) {
            next();
        } else {
            res.redirect('/admin/login');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const isLogout = async (req, res, next) => {
    try {
        if (req.session.is_admin) {
            res.redirect('/admin/dashboard');
        } else {
            next();
        }
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    isLogin,
    isLogout
   
};
