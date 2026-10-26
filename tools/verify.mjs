// Hujjatdagi (24.10.2026) natijalarni dvigatel bilan qayta hisoblab taqqoslaydi.
// Ishga tushirish:  node tools/verify.mjs
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const SEED = require("../data/seed.js");
const ENGINE = require("../src/engine.js");

let fails = 0;
const ok = (cond, msg) => {
  console.log((cond ? "  OK   " : "  XATO ") + msg);
  if (!cond) fails++;
};

const r = ENGINE.compute(SEED);
const exp = SEED.expected;

console.log("\n1) Umumiy holat (hujjat §4)");
ok(SEED.employees.length === exp.totals.employees, `xodimlar: ${SEED.employees.length} = ${exp.totals.employees}`);
ok(SEED.checks.length === exp.totals.checks, `tekshiruvlar: ${SEED.checks.length} = ${exp.totals.checks}`);
ok(SEED.persons.length === exp.totals.persons, `aloqador shaxslar: ${SEED.persons.length} = ${exp.totals.persons}`);
for (const lv of ["yuqori", "orta", "past"]) ok(r.counts[lv] === exp.totals[lv], `${lv}: ${r.counts[lv]} = ${exp.totals[lv]}`);

console.log("\n2) Xavf bali va uning tarkibi (hujjat §5)");
for (const e of SEED.employees) {
  const s = r.byEmp[e.id];
  const pts = s.parts.map((p) => p.pts);
  ok(s.score === exp.scores[e.id], `${e.fio}: ${s.score} (xom ${s.raw}) = ${exp.scores[e.id]}`);
  ok(JSON.stringify(pts) === JSON.stringify(exp.parts[e.id]), `   tarkib [${pts.join(", ")}]`);
}

console.log("\n3) Umumiy aloqalar (hujjat §7)");
const risky = r.shared.filter((s) => s.risky);
ok(risky.length === Object.keys(exp.shared).length, `umumiy xavfli shaxslar: ${risky.length}`);
for (const [pid, emps] of Object.entries(exp.shared)) {
  const s = risky.find((x) => x.personId === pid);
  ok(s && JSON.stringify([...s.empIds].sort()) === JSON.stringify(emps), `   ${pid}: ${s ? s.empIds.join(", ") : "topilmadi"}`);
}

console.log("\n4) Yaxlitlash (float xatosi tekshiruvi)");
ok(ENGINE.round(35 * 0.7) === 25, "35 x 0.7 = 24.5 -> 25");
ok(ENGINE.round(25 * 1.3) === 33, "25 x 1.3 = 32.5 -> 33");
ok(ENGINE.round(25 * 0.7) === 18, "25 x 0.7 = 17.5 -> 18");
ok(ENGINE.round(8 * 0.8) === 6, "8 x 0.8 = 6.4 -> 6");

console.log("\n5) Bilvosita aloqalar (hujjatda yo'q — topilma T-07)");
const name = (id) => SEED.employees.find((e) => e.id === id).fio.split(" ")[0];
const pname = (id) => SEED.persons.find((p) => p.id === id).fio;
for (const x of r.indirect) console.log(`       ${name(x.a)} -> ${pname(x.via[0])} -> ${pname(x.via[1])} -> ${name(x.b)}`);
const pairs = new Set(r.indirect.map((x) => [x.a, x.b].sort().join("-")));
ok([...pairs].sort().join(",") === "e1-e4,e1-e5,e2-e4,e3-e5", `yangi juftliklar: ${[...pairs].sort().join(", ")}`);

console.log(fails ? `\n${fails} ta XATO\n` : "\nHammasi mos: hujjatdagi ballar dvigatel bilan tasdiqlandi.\n");
process.exit(fails ? 1 : 0);
