import {Usuario} from "../modelos/usuarioModelo.js";

export function mapApiToUsuario (apiDatos){

    return new Usuario(
        apiDatos.idUsuario,
        apiDatos.nombreUsuario,
        apiDatos.correo,
       // apiDatos.contrasena,
    );
}