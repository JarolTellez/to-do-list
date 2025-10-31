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

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://to-do-list-psi-roan-29.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      const isAllowed = allowedOrigins.some(allowedOrigin => 
        origin.includes(allowedOrigin.replace(/https?:\/\//, ''))
      );
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Dispositivo-Info"],
  exposedHeaders: ["Set-Cookie"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Dispositivo-Info');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
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
    message: "Backend funcionando"
  });
});

app.get("/check-cookies", (req, res) => {
  console.log("Cookies recibidas:", req.cookies);
  console.log("User Agent:", req.headers["user-agent"]);
  
  res.json({
    accessToken: !!req.cookies.accessToken,
    refreshToken: !!req.cookies.refreshToken,
    allCookies: req.cookies,
    userAgent: req.headers["user-agent"],
    isMobile: /mobile/i.test(req.headers["user-agent"])
  });
});
app.listen(PORT, () => {
  console.log(`Servidor ejecutandose en puerto:${PORT}`);
});