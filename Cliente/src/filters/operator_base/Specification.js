


export class Specification {
  satisfies(task) {
    throw new Error("Metodo debe ser implementado");
  }

  async and(Specification) {
    const { AndSpecification }= await import ("./andSpecification.js");
    return new AndSpecification(this,Specification);
  }

 async or(Specification) {
  const { OrSpecification }= await import( "./orSpecification.js");
    return new OrSpecification(this, Specification);
  }

//   not(Specification) {
//     return new NotSpecification(this);
//   }
}
