require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser'); 
const { 
  tareaController, 
  etiquetaController,
  authController,
} = require('./src/infraestructura/config/dependencias');
const app = express();
const cors = require('cors');
const PORT = 3000;

// Configuración de CORS
const corsOptions = {
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Dispositivo-Info']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middlewares
app.use(cookieParser()); 
app.use(express.json());


// Configuración de rutas
const routerAuth = require('./src/api/rutas/authRutas')(authController);
const routerTarea = require('./src/api/rutas/tareaRutas')(tareaController);
const routerEtiqueta = require('./src/api/rutas/etiquetaRutas')(etiquetaController);

app.use('/auth', routerAuth);
app.use('/tarea', routerTarea);
app.use('/etiqueta', routerEtiqueta);

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});