import * as fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const queries = fs
  .readdirSync(path.resolve(__dirname))
  .filter((file) => file.endsWith(".nql"))
  .map((file) => ({
    file,
    content: fs.readFileSync(path.resolve(__dirname, file), "utf8"),
  }));
