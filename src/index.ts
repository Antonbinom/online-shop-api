import dotenv from "dotenv";
dotenv.config();
import { app } from "./app";

const port: string | number = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`This server had run on http://localhost:${port}`);
});
