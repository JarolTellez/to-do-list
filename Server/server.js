require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
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
const app = express();
const cors = require("cors");
const PORT = 3000;

// Configuración de CORS
const corsOptions = {
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:5173",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Dispositivo-Info"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// services
app.set("sessionService", sessionService);
app.set("authService", authService);
app.set("jwtAuth", jwtAuth);

// Middlewares
app.use(cookieParser());
app.use(express.json());

// Configuración de rutas
const authRouter = require("./src/api/routes/authRoutes")(authController);
const userRouter = require("./src/api/routes/userRoutes")(userController);
const taskRouter = require("./src/api/routes/taskRoutes")(taskController);
const tagRouter = require("./src/api/routes/tagRoutes")(tagController);

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/task", taskRouter);
app.use("/tag", tagRouter);

// Middleware que se ejecuta solo si hay next(error)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
