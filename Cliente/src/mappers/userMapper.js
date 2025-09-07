import {User} from "../models/userModel.js";

export function mapApiToUsuario (apiDatos){

    return new User(
        apiDatos.id,
        apiDatos.userName,
        apiDatos.email,
       // apiDatos.password,
    );
}