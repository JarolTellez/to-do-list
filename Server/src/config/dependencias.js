const TareaDAO = require('../datos/TareaDAO');
const EtiquetaDAO = require('../datos/EtiquetaDAO');
const ServicioTarea = require('../servicios/servicioTarea');
const TareaFactory = require("../factory/tareaFactory");
const TareaMapper = require("../mappers/tareaMapper");
const EtiquetaMapper = require("../mappers/etiquetaMapper");

// mappers y factories
const tareaFactory = new TareaFactory();
const etiquetaMapper = new EtiquetaMapper();
const tareaMapper = new TareaMapper(tareaFactory, etiquetaMapper);

// DAOs con sus dependencias
const tareaDAO = new TareaDAO(tareaMapper);
const etiquetaDAO = new EtiquetaDAO(etiquetaMapper); // Asegúrate que EtiquetaDAO acepte el mapper

// servicios
const servicioTarea = new ServicioTarea(tareaDAO, etiquetaDAO);

module.exports = { 
  servicioTarea,
  tareaDAO,
  etiquetaDAO,
  tareaMapper
};