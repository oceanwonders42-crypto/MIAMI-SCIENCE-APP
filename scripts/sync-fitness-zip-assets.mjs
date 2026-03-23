#!/usr/bin/env node
/**
 * Maps fitness_images_split.zip panels → public/exercises/exercise-{slug}.png
 * Usage: node scripts/sync-fitness-zip-assets.mjs [path-to-zip]
 * Default zip path: ../Downloads/fitness_images_split.zip from repo root (override with arg).
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const SLUGS = [
  "bench-press",
  "squat",
  "deadlift",
  "pull-up",
  "overhead-press",
  "barbell-row",
  "plank",
  "lunge",
  "incline-bench-press",
  "push-up",
  "romanian-deadlift",
  "leg-press",
  "lat-pulldown",
  "lateral-raise",
  "leg-curl",
  "barbell-curl",
  "tricep-pushdown",
  "crunch",
  "cable-fly",
  "calf-raise",
];

const zipArg =
  process.argv[2] ||
  path.join(process.env.HOME || "", "Downloads", "fitness_images_split.zip");

const tmp = path.join(root, ".tmp-fitness-extract-sync");
const pub = path.join(root, "public", "exercises");

if (!fs.existsSync(zipArg)) {
  console.error("Zip not found:", zipArg);
  process.exit(1);
}

fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
execFileSync("unzip", ["-q", "-j", zipArg, "*.png", "-d", tmp], { stdio: "inherit" });

for (let i = 0; i < 20; i++) {
  const men = String(i + 1).padStart(2, "0");
  const wo = String(i + 21).padStart(2, "0");
  const slug = SLUGS[i];
  fs.copyFileSync(
    path.join(tmp, `fitness_image_${men}.png`),
    path.join(pub, `exercise-${slug}.png`)
  );
  fs.copyFileSync(
    path.join(tmp, `fitness_image_${wo}.png`),
    path.join(pub, `exercise-${slug}-women.png`)
  );
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log("Wrote", SLUGS.length * 2, "PNG files to public/exercises/");
