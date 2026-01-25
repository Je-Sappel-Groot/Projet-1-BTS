//
// middleware/setUser.js
// Ce middleware est utile pour rendre l'utilisateur disponible globalement dans les vues EJS, 
//même si la route n'est pas protégée — 
// pratique pour afficher par exemple une navbar dynamique.
const jwt = require('jsonwebtoken'); 

module.exports = (req, res, next) => {
  const token = req.cookies.token; // Récupère le token JWT depuis les cookies (s'il existe)
  if (token) {
    try {
       // Vérifie et décode le token JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SECRET_KEY');
      // Stocke les infos de l'utilisateur dans req.user pour les routes
      req.user = decoded;       // req.user disponible pour les routes
      res.locals.user = decoded; // user disponible dans toutes les vues EJS
    } catch (err) {
       // Si le token est invalide ou expiré, supprime toute info utilisateur
      req.user = null;
      res.locals.user = null;
    }
  } else {
    // Aucun token : l'utilisateur n'est pas connecté
    req.user = null;
    res.locals.user = null;
  }
  next();
};
