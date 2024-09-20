const usuarioDAO = require("../datos/UsuarioDAO");

exports.agregarUsuario = async (req, res) => {
  try {
    const usuario = req.body;
    const usuarioAgregado = await usuarioDAO.agregarUsuario(usuario);
    console.log("Usuario agregado:", usuarioAgregado);
    res.status(201).json(usuarioAgregado);
  } catch (error) {
    console.error("Error al agregar usuario:", error);
    res.status(500).json({ mensaje: "Error al agregar el usuario" });
  }
};

exports.loginUsuario = async (req, res) => {
  const { nombreUsuario, contrasena } = req.body;

  const usuarioEncontrado =
    await usuarioDAO.consultarUsuarioPorNombreContrasena(
      nombreUsuario,
      contrasena
    );

  if (!usuarioEncontrado) {
    return res.status(404).json({ mensaje: "Usuario no encontrado" });
  }

  if (usuarioEncontrado.contrasena !== contrasena) {
    return res.status(401).json({ mensaje: "Contraseña incorrecta" });
  }

  res
    .status(200)
    .json({ mensaje: "Login exitoso", usuario: usuarioEncontrado });
};
