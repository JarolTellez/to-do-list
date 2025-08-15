// require('dotenv').config();
// const express = require ('express');
// const { servicioTarea } = require('./src/infraestructura/config/dependencias');
// const app = express();
// const routerUsuario = require('./src/rutas/usuarioRutas');
// const routerTarea=require("./src/rutas/tareaRutas")(servicioTarea);
// const routerEtiqueta=require("./src/rutas/etiquetaRutas");
// const cors = require('cors');
// const PORT = 3000;


// app.use(cors());
// app.use(express.json());
// app.use('/usuario',routerUsuario);
// app.use("/tarea",routerTarea)
// app.use("/etiqueta",routerEtiqueta);
// app.listen(PORT, () => {
//     console.log('Servidor ')
// })

// server.js
require('dotenv').config();
const express = require('express');
const { 
  tareaController, 
  etiquetaController,
  authController,
} = require('./src/infraestructura/config/dependencias');
const app = express();
const cors = require('cors');
const PORT = 3000;

// Configuración de middlewares
app.use(cors());
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