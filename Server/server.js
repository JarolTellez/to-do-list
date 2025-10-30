require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const { execSync } = require('child_execute');
const fs = require('fs');
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 3000;

console.log('Verificando base de datos...');

console.log('Variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Si' : 'No');
console.log('MYSQL_URL:', process.env.MYSQL_URL ? 'Si' : 'No');

const schemaPath = 'prisma/schema.prisma';
if (fs.existsSync(schemaPath)) {
  console.log('Schema encontrado');
} else {
  console.log('Schema no encontrado');
  console.log('Archivos:', fs.readdirSync('.'));
}

console.log('Ejecutando migraciones...');
try {
  execSync('npx prisma generate', {
    encoding: 'utf8',
    timeout: 60000
  });

  const pushOutput = execSync('npx prisma db push --force --skip-generate', {
    encoding: 'utf8', 
    timeout: 120000
  });
  console.log('Migraciones completadas');

} catch (error) {
  console.log('Error:', error.message);
}

try {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  const tables = await prisma.$queryRaw`SHOW TABLES LIKE 'users'`;
  
  if (tables && tables.length > 0) {
    console.log('Tabla users existe');
  } else {
    console.log('Tabla users NO existe');
  }
  
  await prisma.$disconnect();
} catch (dbError) {
  console.log('Error:', dbError.message);
}

const {
  taskController,
  tagController,
  authController,
  userController,
  authService,
  sessionService,
  jwtAuth,
} = require("./src/infrastructure/config/dependencies");
const { errorHandler } = require("./src/api/middlewares/errorHandler");

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (
      origin.includes("vercel.app") ||
      origin.includes("localhost:") ||
      origin === process.env.FRONTEND_URL
    ) {
      callback(null, true);
    } else {
      callback(new Error("No permitido"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Dispositivo-Info"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.set("sessionService", sessionService);
app.set("authService", authService);
app.set("jwtAuth", jwtAuth);

app.use(cookieParser());
app.use(express.json());

const authRouter = require("./src/api/routes/authRoutes")(authController);
const userRouter = require("./src/api/routes/userRoutes")(userController);
const taskRouter = require("./src/api/routes/taskRoutes")(taskController);
const tagRouter = require("./src/api/routes/tagRoutes")(tagController);

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/task", taskRouter);
app.use("/tag", tagRouter);

app.use(errorHandler);

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend funcionando"
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "API funcionando"
  });
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});