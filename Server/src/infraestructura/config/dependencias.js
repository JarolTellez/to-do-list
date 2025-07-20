// const TareaDAO = require('../datos/TareaDAO');
// const EtiquetaDAO = require('../datos/EtiquetaDAO');
// const ServicioTarea = require('../servicios/servicioTarea');
// const TareaFactory = require("../factory/tareaFactory");
// const TareaMapper = require("../mappers/tareaMapper");
// const EtiquetaMapper = require("../mappers/etiquetaMapper");
// const TareaController = require("../../api/controladores")

// // mappers y factories
// const tareaFactory = new TareaFactory();
// const etiquetaMapper = new EtiquetaMapper();
// const tareaMapper = new TareaMapper(tareaFactory, etiquetaMapper);

// // DAOs con sus dependencias
// const tareaDAO = new TareaDAO(tareaMapper);
// const etiquetaDAO = new EtiquetaDAO(etiquetaMapper); // Asegúrate que EtiquetaDAO acepte el mapper

// // servicios
// const servicioTarea = new ServicioTarea(tareaDAO, etiquetaDAO);

// // Controladores
// const tareaController = new TareaController({
//   servicioTarea,
//   tareaMapper
// });

// module.exports = {
//   tareaController,
//   servicioTarea,
//   tareaDAO,
//   etiquetaDAO,
//   tareaMapper
// };

const TareaDAO = require('../daos/TareaDAO');
const EtiquetaDAO = require('../daos/EtiquetaDAO');
const UsuarioDAO = require('../daos/UsuarioDAO');
const TareaEtiquetaDAO = require("../daos/TareaEtiquetaDAO");
const ServicioTarea = require('../../aplicacion/servicios/servicioTarea');
const ServicioTareaEtiqueta = require("../../aplicacion/servicios/servicioTareaEtiqueta");
const ServicioEtiqueta = require('../../aplicacion/servicios/servicioEtiqueta');
const ServicioUsuario = require('../../aplicacion/servicios/servicioUsuario');
const TareaFactory = require("../../dominio/fabricas/tareaFactory");
const TareaMapper = require("../mappers/tareaMapper");
const TareaEtiquetaMapper = require("../mappers/tareaEtiquetaMapper");
const EtiquetaMapper = require("../mappers/etiquetaMapper");
const UsuarioMapper = require("../mappers/usuarioMapper");
const TareaController = require("../../api/controladores/tareaController");
const EtiquetaController = require("../../api/controladores/EtiquetaController");
const UsuarioController = require("../../api/controladores/UsuarioController");
const ConexionBD = require("../config/conexionBD");


// Mappers y Factories
const tareaFactory = new TareaFactory();
const etiquetaMapper = new EtiquetaMapper();
const usuarioMapper = new UsuarioMapper();
const tareaMapper = new TareaMapper(tareaFactory, etiquetaMapper);
const tareaEtiquetaMapper = new TareaEtiquetaMapper();

const conexionBD = ConexionBD.getInstancia();
// DAOs con sus dependencias
const tareaDAO = new TareaDAO(tareaMapper, conexionBD );
const tareaEtiquetaDAO = new TareaEtiquetaDAO(tareaEtiquetaMapper, conexionBD);
const etiquetaDAO = new EtiquetaDAO(etiquetaMapper, conexionBD);
const usuarioDAO = new UsuarioDAO(usuarioMapper, conexionBD);




// Servicios
const servicioEtiqueta = new ServicioEtiqueta(etiquetaDAO);
const servicioTareaEtiqueta = new ServicioTareaEtiqueta(tareaEtiquetaDAO);
const servicioTarea = new ServicioTarea(tareaDAO, servicioEtiqueta, servicioTareaEtiqueta);
const servicioUsuario = new ServicioUsuario(usuarioDAO);

// Controladores
const tareaController = new TareaController({
  servicioTarea,
  tareaMapper
});

const etiquetaController = new EtiquetaController({
  servicioEtiqueta,
  etiquetaMapper
});

const usuarioController = new UsuarioController({
  servicioUsuario,
  usuarioMapper
});

module.exports = {
  tareaController,
  etiquetaController,
  usuarioController,
  servicioTarea,
  servicioEtiqueta,
  servicioUsuario,
  tareaDAO,
  etiquetaDAO,
  usuarioDAO,
  tareaMapper,
  etiquetaMapper,
  usuarioMapper
};