require('dotenv').config();

const appConfig = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'toDoList',
  },
  jwt: {
    access: {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.EXP_ACCESS_TOKEN || '14m'
    },
    refresh: {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.EXP_REFRESH_TOKEN || '7d'
    }
  },
  session: {
    maxActive: parseInt(process.env.MAX_SESIONES_ACTIVAS) || 30
  },
  environment: process.env.NODE_ENV || 'development'
};

const required = [
  'jwt.access.secret',
  'jwt.refresh.secret'
];

required.forEach(path => {
  const value = path.split('.').reduce((obj, key) => obj && obj[key], appConfig);
  if (!value) {
    throw new Error(`Configuración requerida faltante: ${path}`);
  }
});

module.exports = appConfig;