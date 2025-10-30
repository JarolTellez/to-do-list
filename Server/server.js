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
const PORT = process.env.PORT || 3000;

// Configuración de CORS
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
   const allowedOrigins= [
       "http://localhost:5173",
      "http://localhost:3000",
      process.env.FRONTEND_URL,
      "https://to-do-list-cmj7w0wka-jarol-tellezs-projects.vercel.app",
      "https://to-do-list-ashy-phi-50.vercel.app", 
      "https://*.vercel.app"
    ].filter(Boolean);

    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      allowedOrigins.some((allowed) => origin.includes(allowed))
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

app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Backend funcionando",
    environment: process.env.NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL
  });
});

app.get("/", (req, res) => {
  res.json({ 
    message: "API To-Do List funcionando",
    environment: process.env.NODE_ENV 
  });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV}`);
});
