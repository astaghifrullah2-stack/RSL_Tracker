import "dotenv/config";
import { clearAllData, hasAnyData, seedArchiveData } from "../src/lib/seed";
import { pool } from "../src/db";

async function main() {
  if (process.argv.includes("--replace")) {
    await clearAllData();
  } else if (await hasAnyData()) {
    console.log("Existing league data found — leaving it untouched. Use the Admin data tools or pass --replace.");
    return;
  }
  const result = await seedArchiveData();
  console.log(result.message);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
