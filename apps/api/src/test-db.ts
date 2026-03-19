import "dotenv/config";
import { testDatabaseConnection } from "./db.js";

async function main() {
  try {
    const ok = await testDatabaseConnection();
    console.log("Database connection:", ok ? "OK" : "FAILED");
    process.exit(0);
  } catch (error) {
    console.error("Database connection error:");
    console.error(error);
    process.exit(1);
  }
}

main();
