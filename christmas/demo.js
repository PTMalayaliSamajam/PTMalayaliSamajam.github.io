// Demo backend for previewing the Wish Tree without Firebase: open index.html?demo or admin.html?demo.
// Data lives in this browser's localStorage only. Not loaded at all in normal (live) mode.

const KEY = "wt-demo-v1";
const ORN = ["bauble", "star", "snowflake", "bell", "gift"];
const SAMPLES = [
  ["ml", "എല്ലാവർക്കും സ്നേഹം നിറഞ്ഞ ക്രിസ്മസ് ആശംസകൾ! 🎄"],
  ["en", "Wishing every family in Tranquility a Christmas full of warmth, laughter and good food!"],
  ["ml", "ഈ ക്രിസ്മസ് എല്ലാ വീടുകളിലും സന്തോഷവും സമാധാനവും നിറയ്ക്കട്ടെ."],
  ["en", "Merry Christmas from our little ones to all the uncles and aunties of PTMS ❤️"],
  ["ml", "പുൽക്കൂട്ടിലെ ഉണ്ണിയേശു എല്ലാവരെയും അനുഗ്രഹിക്കട്ടെ. ഹാപ്പി ക്രിസ്മസ്!"],
  ["en", "Thank you to the Samajam volunteers for bringing us together all year. Merry Christmas!"],
  ["ml", "നക്ഷത്രങ്ങൾ പോലെ തിളങ്ങുന്ന ഒരു പുതുവർഷം ആശംസിക്കുന്നു ✨"],
  ["en", "May the new year bring health and happiness to every tower. See you at the carol night!"],
  ["ml", "കേക്കും കരോളും സ്നേഹവും — നമ്മുടെ ക്രിസ്മസ്!"],
  ["en", "First Christmas in Bengaluru away from home — this community feels like family. Thank you!"],
  ["ml", "അപ്പൂപ്പനും അമ്മൂമ്മയ്ക്കും നാട്ടിൽ നിന്ന് ഒരുപാട് സ്നേഹം 🎁"],
  ["en", "Peace on earth, joy in every home. Merry Christmas, PTMS!"],
];
const NAMES = [["Anu Mathew", ""], ["Rahul", "Nair family"], ["", ""], ["Divya & Arun", ""], ["Joseph", "Kurian family"],
  ["Meera", ""], ["", ""], ["Sreejith", "Menon family"], ["Ammu (age 7)", ""], ["Thomas", ""], ["", ""], ["Lekha", "Pillai family"]];

function seed() {
  const wishes = [];
  const now = Date.now();
  for (let i = 0; i < 42; i++) {
    const [lang, msg] = SAMPLES[i % SAMPLES.length];
    const [name, fam] = NAMES[(i * 5) % NAMES.length];
    const anon = !name;
    const status = i < 36 ? "APPROVED" : i < 40 ? "PENDING" : "REJECTED";
    const at = now - (42 - i) * 3.1 * 3600e3;
    wishes.push({
      id: "demo" + String(i).padStart(4, "0"), event: "nammude-christmas-2026",
      tower: "T" + (1 + ((i * 7 + (i % 3) * 4) % 17)), displayName: name, familyName: fam, isAnonymous: anon,
      message: msg, language: lang, ornament: ORN[(i * 3) % 5], status, flags: status === "PENDING" && i === 38 ? ["link"] : [],
      slot: status === "APPROVED" ? i : null, createdAt: at, approvedAt: status === "APPROVED" ? at + 1800e3 : null, reporters: [],
    });
  }
  return { config: { event: "nammude-christmas-2026", open: true, autoApprove: true, reportThreshold: 3 },
    settings: { blockedWords: [] }, wishes, nextSlot: 36, logs: [] };
}

function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.wishes) return s; } catch {}
  const s = seed(); save(s); return s;
}
function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }

const subs = new Set();
function emit() { const s = load(); subs.forEach((f) => f(s)); }
window.addEventListener("storage", (e) => { if (e.key === KEY) emit(); });

const seg = new Intl.Segmenter("ml", { granularity: "grapheme" });
const glen = (t) => [...seg.segment(t || "")].length;
const err = (m) => Object.assign(new Error(m), { message: m });
const pub = (w) => ({ id: w.id, tower: w.tower, name: w.isAnonymous ? "" : [w.displayName, w.familyName].filter(Boolean).join(" · "),
  isAnonymous: w.isAnonymous, message: w.message, language: w.language, ornament: w.ornament, slot: w.slot, at: w.approvedAt });

export const demo = {
  isDemo: true,
  reset() { localStorage.removeItem(KEY); emit(); },
  // ---- public side
  onConfig(cb) { const f = (s) => cb(s.config); subs.add(f); f(load()); },
  onWishes(cb) { const f = (s) => cb(s.wishes.filter((w) => w.status === "APPROVED").map(pub)); subs.add(f); f(load()); },
  async submit(d) {
    await new Promise((r) => setTimeout(r, 700));
    const s = load();
    if (!s.config.open) throw err("The Wish Tree is closed for new wishes.");
    const msg = String(d.message || "").trim();
    if (glen(msg) < 5) throw err("Your wish needs at least 5 letters.");
    if (glen(msg) > 500) throw err("Your wish can be at most 500 letters.");
    if (s.wishes.some((w) => w.message.toLowerCase() === msg.toLowerCase())) throw err("This wish is already on the tree.");
    const lang = /[ഀ-ൿ]/.test(msg) ? "ml" : "en";
    const flags = /(https?:\/\/|www\.)/i.test(msg) ? ["link"] : [];
    const ok = s.config.autoApprove && !flags.length;
    const w = { id: "demo" + Date.now(), event: s.config.event, tower: d.tower, displayName: d.isAnonymous ? "" : d.displayName,
      familyName: d.familyName || "", isAnonymous: !!d.isAnonymous, message: msg, language: lang, ornament: d.ornament || "bauble",
      status: ok ? "APPROVED" : "PENDING", flags, slot: ok ? s.nextSlot++ : null, createdAt: Date.now(), approvedAt: ok ? Date.now() : null, reporters: [] };
    s.wishes.push(w); save(s); emit();
    return { id: w.id, status: w.status, slot: w.slot, ornament: w.ornament, language: lang };
  },
  async report(id) {
    const s = load(); const w = s.wishes.find((x) => x.id === id);
    if (w && w.status === "APPROVED") { w.reporters.push(Date.now()); if (w.reporters.length >= 3) { w.status = "PENDING"; w.flags.push("reported"); } save(s); emit(); }
    return { ok: true };
  },
  // ---- admin side
  async signIn() { return { email: "demo@ptms" }; },
  onAll(cb) { const f = (s) => cb(s.wishes.map((w) => ({ ...w }))); subs.add(f); f(load()); },
  onSettings(cb) { const f = (s) => cb(s.settings); subs.add(f); f(load()); },
  async saveConfig(patch) { const s = load(); Object.assign(s.config, patch); save(s); emit(); },
  async saveSettings(patch) { const s = load(); Object.assign(s.settings, patch); save(s); emit(); },
  async moderate(id, action) {
    const s = load(); const w = s.wishes.find((x) => x.id === id);
    if (action === "approve") { w.status = "APPROVED"; if (typeof w.slot !== "number") w.slot = s.nextSlot++; w.approvedAt = Date.now(); w.reporters = []; }
    if (action === "reject") w.status = "REJECTED";
    if (action === "remove") w.status = "REMOVED";
    s.logs.push({ id, action, at: Date.now() }); save(s); emit(); return { ok: true };
  },
};
