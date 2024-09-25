const bcrypt = require("bcryptjs");

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

exports.loginUsuario = async (req, res) => {
  const { nombreUsuario, contrasena } = req.body;

  const usuarioEncontrado = await usuarioDAO.consultarUsuarioPorNombre(
    nombreUsuario
  );
  console.log(usuarioEncontrado);
  if (!usuarioEncontrado) {
    return res.status(404).json({
      status: "error",
      message: "Usuario no encontrado.",
    });
  }

  const esValida = await bcrypt.compare(
    contrasena.trim(),
    usuarioEncontrado.contrasena
  );
  console.log("es valida: ", esValida);

  if (!esValida) {
    return res.status(401).json({ mensaje: "Contraseña incorrecta" });
  }

  res.status(200).json({
    mensaje: "Login exitoso",
    usuario: usuarioEncontrado,
  });
};
