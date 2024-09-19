const  usuarioDAO = require("../datos/UsuarioDAO");



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
}



