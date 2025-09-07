import { Specification } from './operator_base/Specification.js';


export class CompletedTaskSpecification  extends Specification{

    satisfies(task){
        return task.isCompleted == true;
    }
}