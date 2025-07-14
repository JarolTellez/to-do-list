class Especificacion {
  cumple(tarea) {
    throw new Error("Metodo debe ser implementado");
  }

  and(especificacion) {
    return new AndEspecificacion(this,especificacion);
  }

  or(especificacion) {
    return new OrEspecificacion(this, especificacion);
  }

//   not(especificacion) {
//     return new NotEspecificacion(this);
//   }
}
