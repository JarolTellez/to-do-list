 import { Specification } from "./Specification.js";

export class AndSpecification extends Specification{ 
    constructor(left, right){
        super();
        this.left=left;
        this.right=right;
    }

      satisfies(task){
      return this.left.satisfies(task) && this.right.satisfies(task);
    }
}