/* Regenerates src/data/scam-intel.json from live public feeds. Usage: npm run update-scams */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildIntel, type ScamIntel } from "../src/lib/intel/feeds";

async function main() {
const file = path.join(process.cwd(), "src/data/scam-intel.json");
let previous: ScamIntel | null = null;
try {
  previous = JSON.parse(readFileSync(file, "utf8"));
} catch {}

const intel = await buildIntel(previous);
for (const s of intel.sources) {
  console.log(`${s.ok ? "OK  " : "FAIL"} ${s.name}: ${s.ok ? `${s.items} items, ${s.alerts} scam alerts` : s.error}`);
}
writeFileSync(file, JSON.stringify(intel, null, 2) + "\n");
console.log(`Wrote ${intel.alerts.length} alerts to ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
