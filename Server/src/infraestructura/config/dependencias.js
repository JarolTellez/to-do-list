const Usuario = require("../../dominio/entidades/Usuario");
const Etiqueta = require("../../dominio/entidades/Etiqueta");
const Tarea = require("../../dominio/entidades/Tarea");
const Sesion = require("../../dominio/entidades/Sesion");
const TareaEtiqueta = require("../../dominio/entidades/TareaEtiqueta");
const SesionFabrica = require("../../dominio/fabricas/sesionFabrica");
const TareaDAO = require('../daos/TareaDAO');
const EtiquetaDAO = require('../daos/EtiquetaDAO');
const UsuarioDAO = require('../daos/UsuarioDAO');
const TareaEtiquetaDAO = require("../daos/TareaEtiquetaDAO");
const SesionDAO = require("../../infraestructura/daos/SesionDAO");
const ServicioTarea = require('../../aplicacion/servicios/servicioTarea');
const ServicioTareaEtiqueta = require("../../aplicacion/servicios/servicioTareaEtiqueta");
const ServicioEtiqueta = require('../../aplicacion/servicios/servicioEtiqueta');
const ServicioAuth= require('../../aplicacion/servicios/servicioAuth');
const ServicioSesion = require("../../aplicacion/servicios/servicioSesion");
const TareaFactory = require("../../dominio/fabricas/tareaFactory");
const TareaMapper = require("../mappers/tareaMapper");
const TareaEtiquetaMapper = require("../mappers/tareaEtiquetaMapper");
const EtiquetaMapper = require("../mappers/etiquetaMapper");
const UsuarioMapper = require("../mappers/usuarioMapper");
const SesionMapper = require("../mappers/sesionMapper");
const TareaController = require("../../api/controladores/tareaController");
const EtiquetaController = require("../../api/controladores/EtiquetaController");
const AuthController = require("../../api/controladores/authController");
const ConexionBD = require("../config/conexionBD");
const JwtAuth = require('../../infraestructura/config/jwtAuth');
const UsuarioRespuestaDTO = require("../../aplicacion/dtos/respuestas_dto/usuarioRespuestaDTO");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const {NotFoundError, ValidationError, DatabaseError, AuthenticationError, ConflictError} = require("../../utils/appErrors");



// Mappers y Factories
const tareaFactory = new TareaFactory(Tarea);
const sesionFabrica = new SesionFabrica(Sesion);
const etiquetaMapper = new EtiquetaMapper(Etiqueta);
const usuarioMapper = new UsuarioMapper(Usuario, UsuarioRespuestaDTO);
const tareaMapper = new TareaMapper(tareaFactory, etiquetaMapper);
const tareaEtiquetaMapper = new TareaEtiquetaMapper(TareaEtiqueta);
const sesionMapper = new SesionMapper(Sesion);

const conexionBD = ConexionBD.getInstancia();
// DAOs con sus dependencias
const tareaDAO = new TareaDAO(tareaMapper, conexionBD, DatabaseError, NotFoundError, ConflictError );
const tareaEtiquetaDAO = new TareaEtiquetaDAO(tareaEtiquetaMapper, conexionBD, DatabaseError, NotFoundError, ConflictError);
const etiquetaDAO = new EtiquetaDAO(etiquetaMapper, conexionBD, DatabaseError, NotFoundError, ConflictError);
const usuarioDAO = new UsuarioDAO(usuarioMapper, conexionBD, bcrypt, DatabaseError, NotFoundError, ConflictError);
const sesionDAO = new SesionDAO(sesionMapper, conexionBD, DatabaseError, NotFoundError, ConflictError);

const jwtAuth = new JwtAuth();

// Servicios
const servicioEtiqueta = new ServicioEtiqueta(etiquetaDAO, conexionBD);
const servicioTareaEtiqueta = new ServicioTareaEtiqueta(tareaEtiquetaDAO, conexionBD);
const servicioTarea = new ServicioTarea(tareaDAO, servicioEtiqueta, servicioTareaEtiqueta, conexionBD);
const servicioSesion = new ServicioSesion(sesionDAO,jwtAuth, conexionBD);
const servicioAuth = new ServicioAuth(Usuario, sesionFabrica, servicioSesion, conexionBD, usuarioDAO, jwtAuth, bcrypt, crypto, NotFoundError, ValidationError, DatabaseError, ConflictError);

// Controladores
const tareaController = new TareaController({
  servicioTarea,
  tareaMapper
});

const etiquetaController = new EtiquetaController({
  servicioEtiqueta,
  etiquetaMapper
});

const authController = new AuthController({
  servicioAuth,
  usuarioMapper
});

module.exports = {
  tareaController,
  etiquetaController,
  authController,
  servicioTarea,
  servicioEtiqueta,
  servicioAuth,
  tareaDAO,
  etiquetaDAO,
  usuarioDAO,
  tareaMapper,
  etiquetaMapper,
  usuarioMapper
};