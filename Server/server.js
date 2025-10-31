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
  origin: [
    'https://to-do-list-6mai9lv7r-jarol-tellezs-projects.vercel.app',
    'https://to-do-list-psi-roan-29.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Dispositivo-Info"]
};

app.use(cors(corsOptions));

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