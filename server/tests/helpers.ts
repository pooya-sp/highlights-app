import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { config as loadTestEnv } from "dotenv";
import app from "../src/app.js";

// Load .env.test (contains MONGO_TEST_URI etc.) BEFORE anything reads it.
loadTestEnv({ path: ".env.test" });

// Tests never import server.ts, so dotenv never runs there either. Our
// auth code reads JWT_SECRET at request time (not import time) — so
// setting it here, before any request fires, is all tests need.
process.env.JWT_SECRET =
  "test-secret-do-not-use-in-production-0123456789abcdef";
process.env.JWT_EXPIRES_IN = "1d";

// =====================================================================
// Shared test helpers.
//
// Two database modes:
//
// 1. LOCAL MONGODB (default here): connect to a real MongoDB installed
//    on this machine (e.g. via `winget install MongoDB.Server`), in a
//    dedicated throwaway database called highlights_test. Set
//    MONGO_TEST_URI to enable:
//      mongodb://127.0.0.1:27017/highlights_test
//
// 2. IN-MEMORY (fallback): if MONGO_TEST_URI is not set, boot a
//    throwaway MongoDB via mongodb-memory-server. NOTE: the first run
//    downloads a ~100MB binary — on flaky connections prefer mode 1.
//
// Either way, clearDb() wipes ALL data before every test, so tests are
// fully isolated from each other and from any real data.
//
// NOTE: we deliberately do NOT start the cron job or listen on a port;
// importing app.ts gives us just the Express instance.
// =====================================================================

const USE_LOCAL_MONGO = !!process.env.MONGO_TEST_URI;
let mongo: MongoMemoryServer | undefined;

export async function startTestDb(): Promise<void> {
  if (USE_LOCAL_MONGO) {
    await mongoose.connect(process.env.MONGO_TEST_URI as string);
    return;
  }
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}

export async function stopTestDb(): Promise<void> {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
}

// Clear all collections between tests without tearing down the server.
export async function clearDb(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

export { app };
