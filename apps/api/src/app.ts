import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

const allowedOrigin = process.env["ALLOWED_ORIGIN"];
if (!allowedOrigin && process.env["NODE_ENV"] === "production") {
  throw new Error("ALLOWED_ORIGIN must be set in production");
}
app.use(cors({ origin: allowedOrigin ?? "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Zu viele Anfragen. Bitte warte eine Minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", loginLimiter);
app.use("/api", router);

export default app;
