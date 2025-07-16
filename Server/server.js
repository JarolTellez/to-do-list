require('dotenv').config();
const express = require ('express');
const app = express();
const routerUsuario = require('./src/rutas/usuarioRutas');
const routerTarea=require("./src/rutas/tareaRutas");
const routerEtiqueta=require("./src/rutas/etiquetaRutas");
const cors = require('cors');
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use('/usuario',routerUsuario);
app.use("/tarea",routerTarea)
app.use("/etiqueta",routerEtiqueta);
app.listen(PORT, () => {
    console.log('Servidor ')
})
