require('dotenv').config();
const mysql = require('mysql2/promise');

class ConexionBD {

  constructor() {

    this.pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,  // Máximo número de conexiones concurrentes
      queueLimit: 0  
    });
  }

  // Obtener una conexión del pool
  async conectar() {
    return this.pool.getConnection();
  }

  // Para finalizar el pool
  async cerrarPool() {
    try {
      await this.pool.end();
      console.log('Pool de conexiones cerrado');
    } catch (error) {
      console.error('Error al cerrar el pool', error);
      throw error;
    }
  }
}

module.exports = new ConexionBD();