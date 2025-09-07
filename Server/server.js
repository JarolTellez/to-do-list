require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser'); 
const { 
  taskController, 
  tagController,
  authController,
} = require('./src/infraestructura/config/dependencies');
const {errorHandler} = require("./src/api/middlewares/errorHandler");
const app = express();
const cors = require('cors');
const PORT = 3000;

// Configuración de CORS
const corsOptions = {
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Dispositivo-Info']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middlewares
app.use(cookieParser()); 
app.use(express.json());


// Configuración de rutas
const authRouter = require('./src/api/rutas/authRoutes')(authController);
const taskRouter = require('./src/api/rutas/taskRoutes')(taskController);
const tagRouter = require('./src/api/rutas/tagRoutes')(tagController);

app.use('/auth', authRouter);
app.use('/tarea', taskRouter);
app.use('/etiqueta', tagRouter);

// Middleware que se ejecuta solo si hay next(error)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});