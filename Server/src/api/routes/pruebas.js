// En tu server.js, agregar esto ANTES de las rutas
const pruebas = ((req, res, next) => {
    console.log('=== COOKIE DEBUG ===');
    console.log('Ruta:', req.path);
    console.log('Cookies recibidas:', req.cookies);
    console.log('====================');
    next();
});


module.exports = { pruebas };