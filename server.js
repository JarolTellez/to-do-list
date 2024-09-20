const express = require ('express');
const app = express();
const routerUsuario = require('./src/rutas/usuarioRutas');
const cors = require('cors');
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use('/usuario',routerUsuario);
app.listen(PORT, () => {
    console.log('Servidor de asistencias')
})
