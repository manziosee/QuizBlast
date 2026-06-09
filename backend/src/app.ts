import express from "express";
import helmet from "helmet";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler } from "./middleware/errorHandler";
import router from "./routes";

const app = express();
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());
app.use("/api", router);
app.use(errorHandler);

export default app;
