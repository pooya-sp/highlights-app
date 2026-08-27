// Entry point of the server
import { config as loadEnv } from "dotenv";
import mongoose from "mongoose";
loadEnv({ path: ".env" });
import app from "./src/app.js";
import { startDailyRecheck } from "./src/jobs/dailyRecheck.js";

const PORT = process.env.PORT || 20000;
const DB = process.env.DATABASE_URL;

if (!DB) {
  console.error("❌ DATABASE_URL is missing. Check your .env file..");
  process.exit(1);
}

mongoose
  .connect(DB)
  .then(() => {
    console.log("DB connection successful!");
    startDailyRecheck();
  })
  .catch((err) => console.error("❌ DB connection error:", err));

app.listen(PORT, () => {
  console.log(`🚀 Server is listening on :${PORT}`);
});
