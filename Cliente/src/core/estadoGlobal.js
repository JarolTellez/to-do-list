import { tareasCompletadas } from "../eventos/listeners/tareasListener";
import { getTareasRenderizadas } from "../eventos/manejadores/filtrosManejador";

let estado ={
    tareasPendientes:[],
    tareasCompletadas:[],
    getTareasRenderizadas:[],
    // filtroActual: null,
    // ordenActual: null
}

export const getEstado= ()=> ({...estado});
export const actualizarEstado = (nuevo) =>{
    estado={...estado, ...nuevo};
}