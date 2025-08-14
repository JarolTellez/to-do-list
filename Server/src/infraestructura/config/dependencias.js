const Usuario = require("../../dominio/entidades/Usuario");
const Etiqueta = require("../../dominio/entidades/Etiqueta");
const Tarea = require("../../dominio/entidades/Tarea");
const RefreshToken = require("../../dominio/entidades/RefreshToken");
const TareaEtiqueta = require("../../dominio/entidades/TareaEtiqueta");
const RefreshTokenFabrica = require("../../dominio/fabricas/refreshTokenFabrica");
const TareaDAO = require('../daos/TareaDAO');
const EtiquetaDAO = require('../daos/EtiquetaDAO');
const UsuarioDAO = require('../daos/UsuarioDAO');
const TareaEtiquetaDAO = require("../daos/TareaEtiquetaDAO");
const RefreshTokenDAO = require("../../infraestructura/daos/refreshTokenDAO");
const ServicioTarea = require('../../aplicacion/servicios/servicioTarea');
const ServicioTareaEtiqueta = require("../../aplicacion/servicios/servicioTareaEtiqueta");
const ServicioEtiqueta = require('../../aplicacion/servicios/servicioEtiqueta');
const ServicioUsuario = require('../../aplicacion/servicios/servicioUsuario');
const ServicioRefreshToken = require("../../aplicacion/servicios/servicioRefreshToken");
const TareaFactory = require("../../dominio/fabricas/tareaFactory");
const TareaMapper = require("../mappers/tareaMapper");
const TareaEtiquetaMapper = require("../mappers/tareaEtiquetaMapper");
const EtiquetaMapper = require("../mappers/etiquetaMapper");
const UsuarioMapper = require("../mappers/usuarioMapper");
const RefreshTokenMapper = require("../mappers/refreshTokenMapper");
const TareaController = require("../../api/controladores/tareaController");
const EtiquetaController = require("../../api/controladores/EtiquetaController");
const UsuarioController = require("../../api/controladores/UsuarioController");
const ConexionBD = require("../config/conexionBD");
const JwtAuth = require('../../infraestructura/config/jwtAuth');
const UsuarioRespuestaDTO = require("../../aplicacion/dtos/respuestas_dto/usuarioRespuestaDTO");
const bcrypt = require("bcryptjs");


// Mappers y Factories
const tareaFactory = new TareaFactory(Tarea);
const refreshTokenFabrica = new RefreshTokenFabrica(RefreshToken);
const etiquetaMapper = new EtiquetaMapper(Etiqueta);
const usuarioMapper = new UsuarioMapper(Usuario, UsuarioRespuestaDTO);
const tareaMapper = new TareaMapper(tareaFactory, etiquetaMapper);
const tareaEtiquetaMapper = new TareaEtiquetaMapper(TareaEtiqueta);
const refreshTokenMapper = new RefreshTokenMapper(RefreshToken);

const conexionBD = ConexionBD.getInstancia();
// DAOs con sus dependencias
const tareaDAO = new TareaDAO(tareaMapper, conexionBD );
const tareaEtiquetaDAO = new TareaEtiquetaDAO(tareaEtiquetaMapper, conexionBD);
const etiquetaDAO = new EtiquetaDAO(etiquetaMapper, conexionBD);
const usuarioDAO = new UsuarioDAO(usuarioMapper, conexionBD, bcrypt);
const refreshTokenDAO = new RefreshTokenDAO(refreshTokenMapper, conexionBD);




// Servicios
const servicioEtiqueta = new ServicioEtiqueta(etiquetaDAO);
const servicioTareaEtiqueta = new ServicioTareaEtiqueta(tareaEtiquetaDAO);
const servicioTarea = new ServicioTarea(tareaDAO, servicioEtiqueta, servicioTareaEtiqueta);
const servicioRefreshToken = new ServicioRefreshToken(refreshTokenDAO);
const servicioUsuario = new ServicioUsuario(Usuario, refreshTokenFabrica, servicioRefreshToken, usuarioDAO, JwtAuth, bcrypt);

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