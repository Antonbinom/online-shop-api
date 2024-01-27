import express from "express";
import cors from "cors";

export const app: express.Application = express();

app.use(cors());
app.use(express.json());
// app.use("/api", router);
