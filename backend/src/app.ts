import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler } from "./middleware/errorHandler";
import { swaggerSpec } from "./swagger";
import router from "./routes";

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(corsMiddleware);
app.use(express.json());
app.use(morgan("combined"));

// Rate limiting — 100 req/min per IP on API routes
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — slow down." },
});
app.use("/api", limiter);

// Root → Swagger UI
app.get("/", (_req, res) => res.redirect("/swagger"));

// Root health check (Fly.io probe)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Swagger UI
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "QuizBlast API Docs",
  customCss: ".swagger-ui .topbar { background: #1a1b27 } .swagger-ui .topbar-wrapper img { display: none }",
}));

// REST API
app.use("/api", router);

app.use(errorHandler);

export default app;
