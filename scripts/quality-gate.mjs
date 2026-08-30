import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const warnings = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function sourceFiles(dir) {
  return walk(path.join(root, dir)).filter((file) => /\.(ts|tsx|js|jsx|mjs)$/.test(file));
}

function rel(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function fail(file, message) {
  failures.push(`${rel(file)}: ${message}`);
}

const allSource = sourceFiles("src");

for (const file of allSource) {
  const content = read(file);

  if (/^[\s\S]*["']use client["'];/.test(content)) {
    for (const secret of ["SUPABASE_SERVICE_ROLE_KEY", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]) {
      if (content.includes(secret)) fail(file, `client module references server secret ${secret}`);
    }
    if (content.includes("createAdminClient")) fail(file, "client module imports/uses the Supabase admin client");
  }

  if (content.includes("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY")) {
    fail(file, "service role key must never use a NEXT_PUBLIC_ environment name");
  }
}

const restrictedPortalTokens = [
  "production_cost_snapshot",
  "creative_ape_share_snapshot",
  '.from("ledger_entries")',
  ".from('ledger_entries')",
  "vendor_part_number",
  "account_reference",
];

for (const file of sourceFiles("src/app/portal")) {
  const content = read(file);
  for (const token of restrictedPortalTokens) {
    if (content.includes(token)) fail(file, `organization portal contains restricted internal field/source: ${token}`);
  }
}

const restrictedPublicTokens = [
  "production_cost",
  "creative_ape_share",
  "revenue_share_rule_snapshot",
  '.from("ledger_entries")',
  ".from('ledger_entries')",
  "vendor_part_number",
  "account_reference",
  "weight_oz",
  "length_in",
  "width_in",
  "height_in",
];

for (const file of sourceFiles("src/app/shop")) {
  const content = read(file);
  for (const token of restrictedPublicTokens) {
    if (content.includes(token)) fail(file, `public storefront contains restricted internal field/source: ${token}`);
  }
}

const adminClientPath = path.join(root, "src/lib/supabase/admin.ts");
if (!fs.existsSync(adminClientPath)) {
  failures.push("src/lib/supabase/admin.ts: missing server-only admin client");
} else {
  const content = read(adminClientPath);
  if (!content.includes('import "server-only"')) fail(adminClientPath, 'admin client must import "server-only"');
  if (!content.includes("SUPABASE_SERVICE_ROLE_KEY")) fail(adminClientPath, "admin client must source the service role key server-side");
}

const publicTypesPath = path.join(root, "src/lib/supabase/public-types.ts");
if (fs.existsSync(publicTypesPath)) {
  const content = read(publicTypesPath);
  for (const token of ["production_cost", "creative_ape_share", "vendor_part_number", "weight_oz"]) {
    if (content.includes(token)) fail(publicTypesPath, `public API types expose internal field: ${token}`);
  }
}

for (const file of allSource) {
  const content = read(file);
  const count = (content.match(/\bas any\b/g) ?? []).length;
  if (count > 0) warnings.push(`${rel(file)}: ${count} explicit "as any" cast(s)`);
}

console.log("Quality gate: tenant isolation, secret handling, and public-data boundary checks");
if (warnings.length) {
  console.log("\nWarnings (non-blocking, should trend toward zero):");
  for (const warning of warnings) console.log(`  - ${warning}`);
}

if (failures.length) {
  console.error("\nQuality gate FAILED:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("\nQuality gate passed.");
