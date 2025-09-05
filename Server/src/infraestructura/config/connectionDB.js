require('dotenv').config();
 const mysql = require('mysql2/promise');


class ConnectionDB {
  constructor() {
  
    if (!ConnectionDB.instance) {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10, // el maximo numero de conexiones
      queueLimit: 0 
    });
    ConnectionDB.instance=this;
  }
  return ConnectionDB.instance;
  }


  async conectar() {
    return this.pool.getConnection();
  }

 
  async cerrarPool() {
    try {
      await this.pool.end();
      console.log('Pool de conexiones cerrado');
    } catch (error) {
      console.error('Error al cerrar el pool', error);
      throw error;
    }
  }

  static getInstancia() {
    if (!ConnectionDB.instance) {
      ConnectionDB.instance = new ConnectionDB();
    }
    return ConnectionDB.instance;
  }


  
}

module.exports=ConnectionDB;

