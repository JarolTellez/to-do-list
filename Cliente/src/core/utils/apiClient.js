import { refreshAccessToken } from '../services/auth.js';
import { setAccessToken, getAccessToken, eliminarAccessToken } from "../accessTokenState.js";
import { API_CONFIG } from '../../config/api.js';

 const API_BASE_URL = API_CONFIG.BASE_URL;
 const MAX_REINTENTOS = API_CONFIG.MAX_REINTENTOS;

export async function fetchConRenovacionAccessToken(url, opciones = {}) {
    let accessToken = getAccessToken();
    let reintentos = 0;
    let response;

    // Si no hay accessToken se solicita uno nuevo
    if (!accessToken) {
        try {
            const data = await refreshAccessToken();
            setAccessToken(data.accessToken);
            accessToken = data.accessToken;
        } catch (error) {
            console.error('No se pudo renovar el token inicial:', error);
            redirigirALogin();
            throw new Error('Sesión expirada');
        }
    }

    // Realizar petición el numero de reintentos que se pueden establecidos en la variable
    while (reintentos <= MAX_REINTENTOS) {
        try {
            
            response = await realizarPeticion(url, opciones, accessToken);
            if (response.ok) {
                return response;
            }

            // Si el status es 401 y aún hay intentos disponibles
            if (response.status === 401 && reintentos < MAX_REINTENTOS) {
                console.log('Token expirado, intentando renovar...');
                
                try {
                    const dataRenovacion = await refreshAccessToken();
                    setAccessToken(dataRenovacion.accessToken);
                    accessToken = dataRenovacion.accessToken;
                    reintentos++;
                    continue; // Reintentar con el nuevo accessToken
                } catch (error) {
                    console.error('Error renovando token:', error);
                    reintentos = MAX_REINTENTOS + 1; // Forzar salida del bucle
                    break;
                }
            }

            // Para otros errores que no sean 401
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.mensaje || `Error HTTP: ${response.status}`);
            }

        } catch (error) {
            // Si es error de autenticación y aún se puede reintentar
            if (error.message.includes('401') && reintentos < MAX_REINTENTOS) {
                console.log('Error de autenticación, intentando renovar token...');
                try {
                    const dataRenovacion = await refreshAccessToken();
                    setAccessToken(dataRenovacion.accessToken);
                    accessToken = dataRenovacion.accessToken;
                    reintentos++;
                    continue;
                } catch (errorRenovacion) {
                    console.error('Error renovando token:', errorRenovacion);
                    reintentos = MAX_REINTENTOS + 1;
                    break;
                }
            }
            
            // Si son errores de autenticación  y ya no se puede reintentar
            if (error.message.includes('401') || error.message.includes('Sesión')) {
                eliminarAccessToken();
                redirigirALogin();
            }
            
           // throw error;
        }
    }


    // Se agotaron los reintentos
    eliminarAccessToken();
    redirigirALogin();
    throw new Error('Error de autenticación después de múltiples intentos');
}

async function realizarPeticion(url, opciones, accessToken) {
    const opcionesDefault = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
            ...opciones.headers,
        },
    };

    
    const urlCompleta = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

    return await fetch(urlCompleta, {
        ...opcionesDefault,
        ...opciones,
        headers: {
            ...opcionesDefault.headers,
            ...opciones.headers,
        }
    });
}


export async function manejarRespuestaApi(response) {
    try {
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.mensaje || `Error del servidor: ${response.status}`);
        }
        
        return data;
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error('Respuesta del servidor no válida');
        }
        throw error;
    }
}


function redirigirALogin() {
  
     console.warn('Redirigiendo a login...');
     window.location.href = "index.html";
    
}


const crearMetodoHttp = (method) => async (url, data = null, opciones = {}) => {
    const config = {
        ...opciones,
        method: method.toUpperCase(),
        headers: {
            ...opciones.headers,
        }
    };

    // Manejar body y content-type automáticamente
    if (data !== null) {
        if (data instanceof FormData) {
            config.body = data;
            delete config.headers['Content-Type'];
        } else {
            config.body = JSON.stringify(data);
            config.headers['Content-Type'] = 'application/json';
        }
    }

    const response = await fetchConRenovacionAccessToken(url, config);
    return await manejarRespuestaApi(response);
};


export const api = {
    get: crearMetodoHttp('GET'),
    post: crearMetodoHttp('POST'),
    put: crearMetodoHttp('PUT'),
    patch: crearMetodoHttp('PATCH'),
    delete: crearMetodoHttp('DELETE')
};

