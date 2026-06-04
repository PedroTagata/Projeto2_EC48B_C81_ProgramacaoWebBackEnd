const logger = require('../utils/logger');

function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    
    req.session.error_msg = 'Você precisa estar logado para acessar esta página';
    res.redirect('/login');
}

function isAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.isAdmin) {
        return next();
    }
    
    req.session.error_msg = 'Acesso restrito a administradores';
    res.redirect('/dashboard');
}

function redirectIfAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    next();
}

module.exports = {
    isAuthenticated,
    isAdmin,
    redirectIfAuthenticated
};
