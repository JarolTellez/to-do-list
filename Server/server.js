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
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      "https://to-do-list-6mai9lv7r-jarol-tellezs-projects.vercel.app",
      "https://to-do-list-psi-roan-29.vercel.app",
      "http://localhost:3000",
      "http://localhost:5173",
      "https://localhost:5173",
    ];

    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      console.log("Origin no permitido:", origin);
      callback(new Error("No permitido por CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Dispositivo-Info",
    "X-Requested-With",
    "Accept",
  ],
  exposedHeaders: ["set-cookie"],
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Dispositivo-Info, X-Requested-With"
  );

  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${
      req.headers.origin
    } - User-Agent: ${req.headers["user-agent"]?.substring(0, 50)}`
  );

  if (req.method === "OPTIONS") {
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
    message: "Backend funcionando",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    cors: {
      origin: req.headers.origin,
      credentials: true,
    },
  });
});

app.get("/debug-cookies", (req, res) => {
  const isIOS = /iphone|ipad|ipod/i.test(req.headers["user-agent"] || "");
  const isAndroid = /android/i.test(req.headers["user-agent"] || "");
  const isSafari =
    /safari/i.test(req.headers["user-agent"] || "") &&
    !/chrome/i.test(req.headers["user-agent"] || "");

  res.json({
    origin: req.headers.origin,
    userAgent: req.headers["user-agent"],

    cookiesReceived: req.cookies,
    accessTokenPresent: !!req.cookies.accessToken,
    refreshTokenPresent: !!req.cookies.refreshToken,

    deviceInfo: {
      isIOS: isIOS,
      isAndroid: isAndroid,
      isSafari: isSafari,
      isMobile: isIOS || isAndroid,
    },

    config: {
      environment: process.env.NODE_ENV || "development",
      backendUrl: process.env.BACKEND_URL,
      frontendUrl: process.env.FRONTEND_URL,
      cookieSettings: {
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.BACKEND_URL
          ? new URL(process.env.BACKEND_URL).hostname
          : "localhost",
      },
    },
  });
});

app.get("/test-cookie", (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";

  const testCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    domain: isProduction
      ? process.env.BACKEND_URL
        ? new URL(process.env.BACKEND_URL).hostname
        : undefined
      : undefined,
    maxAge: 5 * 60 * 1000,
  };

  res.cookie("testCookie", `test-${Date.now()}`, testCookieOptions);

  res.json({
    success: true,
    message: "Cookie de prueba establecida",
    cookieOptions: testCookieOptions,
    instructions:
      "Haz otra request a /debug-cookies para verificar si la cookie se envió de vuelta",
  });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutandose en puerto: ${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || "development"}`);
  console.log(`Backend URL: ${process.env.BACKEND_URL || "No configurada"}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || "No configurada"}`);
  console.log(
    `Cookie config: SameSite=${
      process.env.NODE_ENV === "production" ? "none" : "lax"
    }, Secure=${process.env.NODE_ENV === "production"}`
  );
});
