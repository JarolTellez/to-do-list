document.addEventListener("DOMContentLoaded", function () {
  const inputUserName = document.querySelector("#userNameRegistro");
  const inputEmail = document.querySelector("#correoUsuarioRegistro");
  const inputpassword = document.querySelector(
    "#passwordRegistro"
  );
  const btnSignUp = document.querySelector("#btnRegistrar");

  btnSignUp.addEventListener("click", function () {
    createUser();
  });

  async function createUser() {
    const newUser = {
      userName: inputUserName.value,
      email:inputEmail.value,
      password: inputpassword.value,
    };

    const url = "http://localhost:3000/auth/";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
  
      });

      const data = await response.json();

      if (response.ok) {
        inputUserName.value = "";
        inputEmail.value = "";
        inputpassword.value = "";

        alert("Se ha creado correctamente el usuario");

        window.location.href = "index.html";
      } else {
        console.log("Error al Registrar el usuario:", data.mensaje);
        alert(data.mensaje);
      }
    } catch (error) {
      alert(`Error al crear el usuario: ${error.message}`);
    }
  }
});
