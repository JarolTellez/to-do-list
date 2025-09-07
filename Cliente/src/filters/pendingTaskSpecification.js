import { Specification } from './operator_base/Specification.js';

export class PendingTaskSpecification  extends Specification{

    satisfies(task){
        
          return task.isCompleted == false;
    }
}