// middleware/auth.js
const jwt = require('jsonwebtoken');

/**
 * Middleware d'authentification et de restriction par rôle
 * @param {Array} roles - Liste des rôles autorisés (ex: ['admin', 'etudiant'])
 *                        Si vide, toutes les personnes connectées sont autorisées
 */
const auth = (roles = []) => {
  return (req, res, next) => {
    const token = req.cookies?.token; // ✅ Sécurisé si cookies est undefined

    if (!token) {
      // Redirection pour les pages EJS
      if (!req.originalUrl.startsWith('/api')) {
        return res.redirect('/login');
      }
      // Réponse JSON pour API
      return res.status(401).json({ message: 'Authentification requise' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SECRET_KEY');
      req.user = decoded;
      res.locals.user = decoded; // Toujours mettre user dans res.locals pour EJS

      // Vérification du rôle si roles définis
      if (roles.length && !roles.includes(decoded.role)) {
        if (!req.originalUrl.startsWith('/api')) {
          return res.status(403).render('403', { message: 'Accès refusé' }); // Page EJS
        }
        return res.status(403).json({ message: 'Accès refusé' }); // API
      }

      next();
    } catch (err) {
      console.error('Erreur JWT:', err.message);
      if (!req.originalUrl.startsWith('/api')) {
        return res.redirect('/login');
      }
      return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
  };
};

module.exports = auth;
