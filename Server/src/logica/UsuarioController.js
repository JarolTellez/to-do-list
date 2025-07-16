const bcrypt = require("bcryptjs");
const JwtAuth = require('../utils/jwtAuth.js');

const usuarioDAO = require("../datos/UsuarioDAO");
const Usuario = require("../dominio/Usuario");
const e = require("express");

exports.agregarUsuario = async (req, res) => {
  try {
    const { nombreUsuario, correo, contrasena } = req.body;
    const existe = await usuarioDAO.consultarUsuarioPorNombre(nombreUsuario);
    if (existe) {
      return res.status(409).json({ mensaje: "El usuario ya existe" });
    }

    const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);
    const usuario = new Usuario(
      null,
      nombreUsuario,
      correo,
      contrasenaEncriptada
    );
    usuario.validar();
    const usuarioAgregado = await usuarioDAO.agregarUsuario(usuario);
    console.log("Usuario agregado:", usuarioAgregado);
    return res.status(201).json(usuarioAgregado);
  } catch (error) {
    console.error("Error al agregar usuario:", error);
    return res.status(500).json({
      status: "error",
      message: "Ocurrió un error al intentar registrar el usuario.",
      error: error.message,
    });
  }
};

// exports.loginUsuario = async (req, res) => {
//   const { nombreUsuario, contrasena } = req.body;

//   const usuarioEncontrado = await usuarioDAO.consultarUsuarioPorNombre(
//     nombreUsuario
//   );
//   console.log(usuarioEncontrado);
//   if (!usuarioEncontrado) {
//     return res.status(404).json({
//       status: "error",
//       message: "Usuario no encontrado.",
//     });
//   }

//   const esValida = await bcrypt.compare(
//     contrasena.trim(),
//     usuarioEncontrado.contrasena
//   );
//   console.log("es valida: ", esValida);

//   if (!esValida) {
//     return res.status(401).json({ mensaje: "Contraseña incorrecta" });
//   }

//   res.status(200).json({
//     mensaje: "Login exitoso",
//     usuario: usuarioEncontrado,
//   });
// };

exports.loginUsuario = async (req, res) => {
  const { nombreUsuario, contrasena } = req.body;

  try {
    const usuarioEncontrado = await usuarioDAO.consultarUsuarioPorNombre(nombreUsuario);
    
console.log(usuarioEncontrado);
    if (!usuarioEncontrado) {
      return res.status(404).json({
        status: "error",
        message: "Usuario no encontrado"
      });
    }


    const esValida = await bcrypt.compare(contrasena.trim(), usuarioEncontrado.contrasena);
    
    if (!esValida) {
      return res.status(401).json({
        status: "error",
        message: "Credenciales inválidas"
      });
    }

    const tokenAcceso = JwtAuth.generarTokenAcceso(usuarioEncontrado.idUsuario, usuarioEncontrado.rol);
    const tokenRefresco = JwtAuth.generarRefreshToken(usuarioEncontrado.idUsuario);
   // await guardarRefreshTokenEnBD(usuarioEncontrado.id, tokenRefresco);

    const usuarioRespuesta = {
      idUsuario: usuarioEncontrado.id_usuario,
      nombreUsuario: usuarioEncontrado.nombre_usuario,
      correo: usuarioEncontrado.correo,
      rol: usuarioEncontrado.rol
    };

    res.status(200).json({
      status: "success",
      message: "Autenticación exitosa",
      data: {
        usuario: usuarioRespuesta,
        tokenAcceso,
        tokenRefresco,
        expiraEn: 900 // 15 minutos en segundos
      }
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor"
    });
  }
};