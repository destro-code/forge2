import { readFileSync } from "fs";
import { json } from "vite";

const file = readFileSync("./src/data/lessons.json", "utf-8");
const plugin = json();
// We need to simulate how Vite's json plugin works
// But it just calls JSON.parse() internally!
// Wait, Vite 4+ does JSON.parse() and exports it.
// Let's see what happens.
