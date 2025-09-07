let accessToken = null;

export function setAccessToken(token){
    accessToken = token;
}

export function getAccessToken(){
    return accessToken;
}

export function eliminarAccessToken(){
    accessToken= null;
}