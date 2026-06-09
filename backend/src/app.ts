import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler } from "./middleware/errorHandler";
import { swaggerSpec } from "./swagger";
import router from "./routes";

const app = express();

app.use(helmet({ contentSecurityPolicy: false })); // CSP off so Swagger UI loads
app.use(corsMiddleware);
app.use(express.json());

// Root health — for Fly.io health checks
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Swagger UI
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "QuizBlast API Docs",
}));

// REST API
app.use("/api", router);

app.use(errorHandler);

export default app;
