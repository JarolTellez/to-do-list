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

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://tu-frontend.vercel.app',
      'https://tu-frontend.netlify.app',
      'http://localhost:3000',
      'http://localhost:5173'
    ].filter(Boolean);

    const isAllowed = allowedOrigins.some(allowedOrigin => 
      origin.includes(allowedOrigin) || origin === allowedOrigin
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Dispositivo-Info"],
  exposedHeaders: ["Set-Cookie"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Headers adicionales para compatibilidad
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  
  const requestOrigin = req.headers.origin;
  if (requestOrigin) {
    res.header('Access-Control-Allow-Origin', requestOrigin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Dispositivo-Info');
  next();
});

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
  console.log(`Servidor ejecutándose en puerto:${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV}`);
});