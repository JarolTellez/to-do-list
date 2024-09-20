const UsuarioController = require("../../logica/UsuarioController.js");
const Usuario = require("../../dominio/Usuario.js");
const { response } = require("express");

document.addEventListener("DOMContentLoaded", function(){
    const inputNombreUsuario = document.querySelector("#nombreUsuario");
    const inputContrasenaUsuario = document.querySelector("#contrasenaUsuario");
   const btnLogin=document.querySelector( "#btnLogin");

   btnLogin.addEventListener("click",function(){
    login();
   });

   async function login(){
        const usuarioLogin=new Usuario(null,inputNombreUsuario.ariaValueMax,null,inputContrasenaUsuario);

        const urlUsuarioLogin="http://localhost:3000/usuario/login";

        try {
         
            const response = await fetch(urlUsuarioLogin, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(usuarioLogin) 
            });

           
            const data = await response.json();
            
            if (response.ok) {
                console.log('Login exitoso:', data);
                alert("Login exitoso!");
                window.location.href = "principal.html";
            } else {
               
                console.log('Error al iniciar sesion:', data.mensaje);
                alert(data.mensaje);
            }
        } catch (error) {
            console.error('Hubo un error con la solicitud de login:', error);
            alert("Hubo un error con la solicitud de login.");
        }
    }

    });