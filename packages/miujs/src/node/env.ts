import path from "path";
import fse from "fs-extra";

export async function loadEnv(root: string): Promise<void> {
  const envPath = path.join(root, ".env");
  try {
    await fse.readFile(envPath);
  } catch (err) {
    return;
  }
  console.log(`Loading environment variables from .env`);
  const result = require("dotenv").config({ path: envPath });
  if (result.error) {
    throw result.error;
  }
}
