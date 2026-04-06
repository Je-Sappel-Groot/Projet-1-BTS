// app.js
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const https = require('https');
const fs = require('fs');

const sequelize = require('./config/db'); // ⚠️ Import de Sequelize depuis config/db.js

// Import des routes API et EJS
const apiEtudiantsRouter = require('./routes/apiEtudiants');
const etudiantsRoutes = require('./routes/etudiants');

const apiEnseignantsRouter = require('./routes/apiEnseignants');
const enseignantsRoutes = require('./routes/enseignants');

const apiCoursRouter = require('./routes/apiCours');
const apiSessionsRouter = require('./routes/apiSessions');
const coursRoutes = require('./routes/cours');
const sessionsRoutes = require('./routes/sessions');

const apiNotesRouter = require('./routes/apiNotes');
const notesRoutes = require('./routes/notes');

const apiContactsRouter = require('./routes/apiContacts');
const apiDashboardRouter = require('./routes/apiDashboard');
const contactsRoutes = require('./routes/contacts');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');


const apiUsersRouter = require('./routes/apiUsers');


const authRouter = require('./routes/auth');       // Pages HTML
const apiAuthRouter = require('./routes/apiAuth'); // API REST
// Middleware pour setUser
const setUser = require('./middelwares/setUser');

const app = express();

// 🌐 Autoriser les requêtes cross-origin
app.use(cors());

// 🔧 Middlewares
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // ✅ DOIT être avant setUser
app.use(setUser);        // Middleware pour avoir `user` disponible dans toutes les vues

// 📂 Configuration du moteur de vues EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 📦 Dossier public + Bootstrap
app.use(express.static('public'));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));

// 🧭 Routes EJS
app.use('/', indexRouter);
app.use('/users', usersRouter);



// 🧭 Routes API
app.use('/api/etudiants', apiEtudiantsRouter);
app.use('/api/enseignants', apiEnseignantsRouter);
app.use('/api/cours', apiCoursRouter);
app.use('/api/sessions', apiSessionsRouter);
app.use('/api/notes', apiNotesRouter);
app.use('/api/contacts', apiContactsRouter);
app.use('/api/users', apiUsersRouter);
app.use('/api/dashboard', apiDashboardRouter);

// 🧭 Routes frontend (EJS étudiants)
app.use('/', etudiantsRoutes);
app.use('/', enseignantsRoutes);
app.use('/cours', coursRoutes);
app.use('/sessions', sessionsRoutes);
app.use('/notes', notesRoutes);
app.use('/contacts', contactsRoutes);
app.use('/', authRouter);     // GET /login et /register pour les pages
app.use('/api', apiAuthRouter); // POST /api/login, POST /api/register, POST /api/logout



// ⚠️ Gestion des erreurs 404
app.use((req, res, next) => {
  if (req.accepts('json')) {
    res.status(404).json({ message: 'Route non trouvée' });
  } else {
    res.status(404).render('404', { title: '404 - Page non trouvée' });
  }
});

// ⚠️ Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur :', err);
  if (req.accepts('json')) {
    res.status(err.status || 500).json({ message: err.message || 'Erreur interne du serveur' });
  } else {
    res.status(err.status || 500).render('error', { error: err, title: 'Erreur serveur' });
  }
});

// 🚀 Lancer le serveur après la connexion à MySQL
const PORT = process.env.PORT || 3010;

// (async () => {
//   try {
//     await sequelize.authenticate();
//     console.log(`✅ Connecté à la base MySQL "${process.env.DB_NAME}" via Sequelize`);

//     // ❗ Si tu veux créer automatiquement les tables (optionnel)
//     // await sequelize.sync({ alter: false });

//     app.listen(PORT, () => {
//       console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
//     });
//   } catch (error) {
//     console.error('❌ Erreur de connexion MySQL :', error);
//   }
// })();

(async () => {
 try {
 await sequelize.authenticate();
 console.log(' Connecté à la base MySQL "university" via Sequelize');
 const options = {
 key: fs.readFileSync('key.pem'),
 cert: fs.readFileSync('cert.pem')
 };
 https.createServer(options, app).listen(PORT, () => {
 console.log(` Serveur HTTPS démarré sur https://localhost:${PORT}`);
 });
 } catch (error) {
 console.error(' Erreur de connexion MySQL :', error);
 }
})();

module.exports = app;



