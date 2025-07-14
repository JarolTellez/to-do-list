


export class Especificacion {
  cumple(tarea) {
    throw new Error("Metodo debe ser implementado");
  }

  async and(especificacion) {
    const { AndEspecificacion }= await import ("./andEspecificacion.js");
    return new AndEspecificacion(this,especificacion);
  }

 async or(especificacion) {
  const { OrEspecificacion }= await import( "./orEspecificacion.js");
    return new OrEspecificacion(this, especificacion);
  }

//   not(especificacion) {
//     return new NotEspecificacion(this);
//   }
}
