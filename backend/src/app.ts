import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler } from "./middleware/errorHandler";
import { swaggerSpec } from "./swagger";
import router from "./routes";

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(corsMiddleware);
app.use(express.json());

// Root → redirect to Swagger UI
app.get("/", (_req, res) => res.redirect("/swagger"));

// Root health check (for Fly.io)
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
