
// import { Etiqueta } from "../../modelos/etiquetaModelo.js";
// export const etiquetasSeleccionadas = []; // Almacenar etiquetas que se van seleccionando

// const etiquetas = []; // Para almacenar las etiquetas consultadas
// //PASARLO A ESTADO GLOBAL
//  const idUsuario=sessionStorage.getItem("idUsuario")

// export const componentesEtiquetas = {
//   //Para mostrar las etiquetas que el usuario va agregando a la tarea
//   renderizarEtiquetas(listaEtiquetas) {
//     listaEtiquetas.innerHTML = "";
//     etiquetasSeleccionadas.forEach((etiqueta) => {
//       const li = document.createElement("li");
//       if (etiqueta.idEtiqueta) {
//         li.setAttribute("data-id", etiqueta.idEtiqueta);
//       }
//       li.textContent = etiqueta; 
  
//       const botonEliminar = document.createElement("span");
//       botonEliminar.textContent = " x";
//       botonEliminar.className = "btnEliminarEtiqueta";

//       botonEliminar.addEventListener("click", () => {
//         const nombreEtiqueta = li.textContent.split(" ");
//         this.eliminar(nombreEtiqueta[0].trim());
//         li.remove();
      
//       });

//       li.appendChild(botonEliminar);
      
//       listaEtiquetas.appendChild(li);
//     });
//   },

//   // Método para eliminar una etiqueta de las seleccionadas
//   eliminar(nombre) {
//     let indice = etiquetasSeleccionadas.findIndex(
//       (etiqueta) => etiqueta.nombre === nombre
//     );

//     if (indice !== -1) {
//       etiquetasSeleccionadas.splice(indice, 1);
//       console.log("Etiquetas actuales:",etiquetasSeleccionadas);
//     }
//   },

//   // Método para mostrar las etiquetas del usuario guardadas en la base de datos
//   async mostrarEtiquetasConsultadas(
//     query,
//     contenedorConsultadas,
//     inputEtiqueta,
//     etiquetasConsultadas
//   ) {
//     contenedorConsultadas.innerHTML = ""; // Limpiar sugerencias previas
//     if (query) {
//       console.log("ETIQUETAS CONSULTADAS AL MOSTRAR COINCIDENCIAS: ", etiquetasConsultadas);
    
//       etiquetas.length = 0;
//       etiquetasConsultadas.forEach((el) => etiquetas.push(el));

//       // Filtra para mostrar las que coincidan con el query(ingreso el usuario) y que no han sido agregadas previamente en el input
//       const etiquetasFiltradas = etiquetasConsultadas.filter(
//         (etiqueta) =>
//           etiqueta.nombreEtiqueta.toLowerCase().includes(query.toLowerCase()) &&
//           !etiquetasSeleccionadas.find((el) => el.nombreEtiqueta === etiqueta.nombreEtiqueta)
//       );

//       if (etiquetasFiltradas.length > 0) {
//         etiquetasFiltradas.forEach((etiqueta) => {
//           const li = document.createElement("li");
//           li.textContent = etiqueta.nombreEtiqueta;
//           li.setAttribute("data-id", etiqueta.idEtiqueta);
//           li.addEventListener("click", () => {
//             this.agregarEtiquetaInput(
//               etiqueta,
//               listaEtiquetas,
//               contenedorConsultadas,
//               inputEtiqueta
//             );
//           });
//           contenedorConsultadas.appendChild(li);
//         });

//         contenedorConsultadas.classList.add("active"); // Mostrar sugerencias
//       } else {
//         contenedorConsultadas.classList.remove("active");
//       }
//     } else {
//       contenedorConsultadas.classList.remove("active"); // Ocultar sugerencias si no hay texto
//     }
//   },

//   // Método para agregar una etiqueta que esta en el input
//   agregarEtiquetaInput(
//     etiqueta,
//     listaEtiquetas,
//     contenedorConsultadas,
//     inputEtiqueta
//   ) {

//     if(!Array.isArray(etiqueta)){
//       etiqueta=[etiqueta];
//     }
//     etiqueta.forEach(el=>{
//     etiquetasSeleccionadas.push(el);
//   });
//   console.log("ETIQUETAS AGREGADAS A INPUT:", etiquetasSeleccionadas);
//     this.renderizarEtiquetas(listaEtiquetas);
//     inputEtiqueta.value = ""; // Limpiar el input
//     this.mostrarEtiquetasConsultadas("", contenedorConsultadas); // Limpiar sugerencias
//   },

//   // Método para buscar coincidencias, si es un objeto quiere decir que esta registrada y se regresa tal cual, si no se regresa solo un
//   // objeto con la clave "nombre:" y el valor
//   buscarCoincidencias(etiqueta) {
//     const etiquetaRegistrada = etiquetas.find(
//       (el) => el.nombreEtiqueta.toLowerCase() === etiqueta.toLowerCase()
//     );


//    // console.log("ETIQUERAS SELECCIOADAS:", id, etiquetasSeleccionadas);
//     console.log("IDUSUARIO: ", idUsuario);
 

//     const seleccionada = etiquetasSeleccionadas.find(
//       (el) => el.nombreEtiqueta.toLowerCase() === etiqueta.toLowerCase()
//     );

//     if (seleccionada) {
//       return false;
//     } else if (typeof etiqueta === "object") {
//       return etiqueta;
//     }

//     return etiquetaRegistrada
//   ? etiquetaRegistrada
//   : new Etiqueta(
//       null,                 // idEtiqueta
//       etiqueta,             // nombreEtiqueta
//       null,                 // descripcion
//       false,                // existente
//       false,                // eliminar
//       idUsuario,            // idUsuario
//       null                  // idTareaEtiqueta
//     );
//   },
// };


//////////////////////////////
import { Etiqueta } from "../../modelos/etiquetaModelo.js";

//EESTA GUARDA LAS ETIQUETAS SELECCIONADAS POR EL USUARIO EN EL INPUT LA PUEDO PASAR A ESTADO GLOBAL
export const etiquetasSeleccionadas = [];
const etiquetas = [];

const idUsuario = sessionStorage.getItem("idUsuario");

export const componentesEtiquetas = {
  renderizarEtiquetas(listaEtiquetas) {
      console.log("ETIQUETAS EN RENDERIZACION: ",etiquetasSeleccionadas);
    listaEtiquetas.innerHTML = "";

    etiquetasSeleccionadas
      .filter((etiqueta) => !etiqueta.eliminar)
      .forEach((etiqueta) => {
        const li = document.createElement("li");

        if (etiqueta.idEtiqueta) {
          li.setAttribute("data-id", etiqueta.idEtiqueta);
        }

        li.textContent = etiqueta.nombreEtiqueta;

        const botonEliminar = document.createElement("span");
        botonEliminar.textContent = " x";
        botonEliminar.className = "btnEliminarEtiqueta";

        botonEliminar.addEventListener("click", () => {
          console.log(`\nEliminando etiqueta: "${etiqueta.nombreEtiqueta}"`);
          this.eliminar(etiqueta.nombreEtiqueta);
          this.renderizarEtiquetas(listaEtiquetas);
        });

        li.appendChild(botonEliminar);
        listaEtiquetas.appendChild(li);
      });
    
  },

  eliminar(nombreEtiqueta) {
    const indice = etiquetasSeleccionadas.findIndex(
      (etiqueta) => etiqueta.nombreEtiqueta === nombreEtiqueta
    );

    if (indice !== -1) {
      const etiqueta = etiquetasSeleccionadas[indice];

      if (etiqueta.existente && etiqueta.idTareaEtiqueta) {
        etiqueta.eliminar = true;
        console.log(`Marcada como eliminar: "${nombreEtiqueta}"`);
      } else {
        etiquetasSeleccionadas.splice(indice, 1);
        console.log(`Eliminada totalmente: "${nombreEtiqueta}"`);
      }

      console.log("Lista actual de etiquetas seleccionadas:");
      console.log(JSON.stringify(etiquetasSeleccionadas, null, 2));
    }
  },

  async mostrarEtiquetasConsultadas(
    query,
    contenedorConsultadas,
    inputEtiqueta,
    etiquetasConsultadas
  ) {
    contenedorConsultadas.innerHTML = "";

    if (query) {
      etiquetas.length = 0;
      etiquetasConsultadas.forEach((el) => etiquetas.push(el));

      const etiquetasFiltradas = etiquetasConsultadas.filter(
        (etiqueta) =>
          etiqueta.nombreEtiqueta.toLowerCase().includes(query.toLowerCase()) &&
          !etiquetasSeleccionadas.find(
            (el) => el.nombreEtiqueta === etiqueta.nombreEtiqueta && !el.eliminar
          )
      );

      if (etiquetasFiltradas.length > 0) {
        etiquetasFiltradas.forEach((etiqueta) => {
          const li = document.createElement("li");
          li.textContent = etiqueta.nombreEtiqueta;
          li.setAttribute("data-id", etiqueta.idEtiqueta);

          li.addEventListener("click", () => {
            this.agregarEtiquetaInput(
              etiqueta,
              listaEtiquetas,
              contenedorConsultadas,
              inputEtiqueta
            );
          });

          contenedorConsultadas.appendChild(li);
        });

        contenedorConsultadas.classList.add("active");
      } else {
        contenedorConsultadas.classList.remove("active");
      }
    } else {
      contenedorConsultadas.classList.remove("active");
    }
  },

  agregarEtiquetaInput(etiqueta, listaEtiquetas, contenedorConsultadas, inputEtiqueta) {
    const etiquetasParaAgregar = Array.isArray(etiqueta) ? etiqueta : [etiqueta];

    etiquetasParaAgregar.forEach((el) => {
      const existente = etiquetasSeleccionadas.find(
        (e) => e.nombreEtiqueta === el.nombreEtiqueta
      );

      if (existente) {
        existente.eliminar = false;
        console.log(`Restaurada etiqueta: "${el.nombreEtiqueta}"`);
      } else {
        etiquetasSeleccionadas.push(el);
        console.log(`Agregada nueva etiqueta: "${el.nombreEtiqueta}"`);
      }
    });

    console.log("Lista actual de etiquetas seleccionadas:");
    console.log(JSON.stringify(etiquetasSeleccionadas, null, 2));

    this.renderizarEtiquetas(listaEtiquetas);
    inputEtiqueta.value = "";
    this.mostrarEtiquetasConsultadas("", contenedorConsultadas, inputEtiqueta, etiquetas);
  },

  buscarCoincidencias(etiquetaTexto) {
    const etiquetaRegistrada = etiquetas.find(
      (el) => el.nombreEtiqueta.toLowerCase() === etiquetaTexto.toLowerCase()
    );

    const yaSeleccionada = etiquetasSeleccionadas.find(
      (el) => el.nombreEtiqueta.toLowerCase() === etiquetaTexto.toLowerCase() && !el.eliminar
    );

    if (yaSeleccionada) {
      console.log(`Ya está seleccionada: "${etiquetaTexto}"`);
      return false;
    }

    if (typeof etiquetaTexto === "object") {
      console.log("Etiqueta recibida como objeto:", etiquetaTexto);
      return etiquetaTexto;
    }

    const nuevaEtiqueta = etiquetaRegistrada
      ? new Etiqueta(
          etiquetaRegistrada.idEtiqueta,
          etiquetaRegistrada.nombreEtiqueta,
          etiquetaRegistrada.descripcion,
          true, // existente
          false,
          idUsuario,
          etiquetaRegistrada.idTareaEtiqueta || null
        )
      : new Etiqueta(
          null,
          etiquetaTexto,
          null,
          false,
          false,
          idUsuario,
          null
        );

    console.log("Resultado de buscarCoincidencias:");
    console.log(nuevaEtiqueta);
    return nuevaEtiqueta;
  },
};
