// require("dotenv").config();
// const express = require("express");
// const cookieParser = require("cookie-parser");
// const {
//   taskController,
//   tagController,
//   authController,
//   userController,
//   authService,
//   sessionService,
//   jwtAuth,
// } = require("./src/infrastructure/config/dependencies");
// const { errorHandler } = require("./src/api/middlewares/errorHandler");
// const app = express();
// const cors = require("cors");
// const PORT = process.env.PORT || 3000;

// // Configuración de CORS
// const corsOptions = {
//   origin: function (origin, callback) {
//     if (!origin) return callback(null, true);

//     if (
//       origin.includes("vercel.app") ||
//       origin.includes("localhost:") ||
//       origin === process.env.FRONTEND_URL
//     ) {
//       callback(null, true);
//     } else {
//       console.log("Bloqueado por CORS:", origin);
//       callback(new Error("No permitido por CORS"));
//     }
//   },
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization", "Dispositivo-Info"],
// };

// app.use(cors(corsOptions));
// app.options("*", cors(corsOptions));

// // services
// app.set("sessionService", sessionService);
// app.set("authService", authService);
// app.set("jwtAuth", jwtAuth);

// // Middlewares
// app.use(cookieParser());
// app.use(express.json());

// // Configuración de rutas
// const authRouter = require("./src/api/routes/authRoutes")(authController);
// const userRouter = require("./src/api/routes/userRoutes")(userController);
// const taskRouter = require("./src/api/routes/taskRoutes")(taskController);
// const tagRouter = require("./src/api/routes/tagRoutes")(tagController);

// app.use("/auth", authRouter);
// app.use("/user", userRouter);
// app.use("/task", taskRouter);
// app.use("/tag", tagRouter);

// // Middleware que se ejecuta solo si hay next(error)
// app.use(errorHandler);

// app.get("/health", (req, res) => {
//   res.json({
//     status: "OK",
//     message: "Backend funcionando",
//     environment: process.env.NODE_ENV,
//     frontendUrl: process.env.FRONTEND_URL,
//   });
// });

// app.get("/", (req, res) => {
//   res.json({
//     message: "API To-Do List funcionando",
//     environment: process.env.NODE_ENV,
//   });
// });

// app.listen(PORT, () => {
//   console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
//   console.log(`Entorno: ${process.env.NODE_ENV}`);
// });


require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const { execSync } = require('child_process');
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 3000;

console.log('Verificando base de datos...');
try {
  console.log('Ejecutando migraciones...');
  const output = execSync('npx prisma db push --skip-generate', {
    encoding: 'utf8',
    timeout: 120000,
    stdio: 'inherit'
  });
  console.log('Migraciones completadas');
} catch (error) {
  console.log('Error en migraciones:', error.message);
}

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
      console.log("Bloqueado por CORS:", origin);
      callback(new Error("No permitido por CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Dispositivo-Info"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

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
    message: "Backend funcionando",
    environment: process.env.NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL,
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "API To-Do List funcionando",
    environment: process.env.NODE_ENV,
  });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV}`);
});