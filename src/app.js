const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const submoduleRoutes = require('./routes/submoduleRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const progressRoutes = require('./routes/progressRoutes');
const activityRoutes = require('./routes/activityRoutes');

// Inicializar app
const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Conectar a la base de datos
connectDB();

// Definir rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/submodules', submoduleRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/activity', activityRoutes);

// Middleware de manejo de errores
app.use(errorHandler);

// Puerto y arranque del servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

module.exports = app;
