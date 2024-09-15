require('dotenv').config(); 
const mysql = require('mysql2/promise');


class ConexionBD{

  constructor(){
    this.connection=null;
  }

async conectar(){
  if (!this.connection) {
    try {
        this.connection = await mysql.createConnection({
          host: process.env.DB_HOST, 
          user: process.env.DB_USER,    
          password: process.env.DB_PASSWORD, 
          database: process.env.DB_NAME
        });
        console.log('Conexión establecida');
    } catch (error) {
        console.error('Error conectando a la base de datos:', error);
        throw error;
    }
}
return this.connection;
}

async desconectar(){
  if (this.connection) {
    try {
        await this.connection.end();
        console.log('Conexión cerrada');
    } catch (error) {
        console.error('Error cerrando la conexión:', error);
        throw error;
    } finally {
        this.connection = null;
    }
}
}

}

module.exports = new ConexionBD();