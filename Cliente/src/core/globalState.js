import { completedTasks } from "../events/listeners/tasksListener";
import { getTareasRenderizadas } from "../events/manejadores/filtrosManejador";

let state ={
    pendingTasks:[],
    completedTasks:[],
    getRenderTags:[],
    // filtroActual: null,
    // ordenActual: null
}

export const getSate= ()=> ({...state});
export const updateSate = (newState) =>{
    state={...state, ...newState};
}