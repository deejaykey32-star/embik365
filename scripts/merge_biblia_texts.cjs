// Podmienia tekst czytania (sekcja 1) w danych Biblia365 na teksty
// ze scripts/biblia_teksty/y{1..4}/*.txt (przekłady własne apokryfów i pism Ojców).
//
// Format pliku:
//   @@ <dzień> | <księga> <rozdział>
//   % Przekład własny z ...        -> nagłówek "#### ..." (lektor go pomija)
//   ## Rozdział 3                  -> nagłówek "#### Rozdział 3" (lektor go pomija)
//   1 Treść wersetu...             -> "**1** Treść wersetu..."
//   kolejna linia bez numeru       -> dopisywana do poprzedniego wersetu
//
// Nagłówki "# ...", "## 1. ..." i "### ..." oraz komentarz (sekcje 2+) pozostają bez zmian.
// Użycie: node scripts/merge_biblia_texts.cjs [rok...]

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TEXTS_DIR = path.join(__dirname, 'biblia_teksty');

function parseTextFile(text, file) {
  const blocks = {};
  const parts = text.replace(/\r\n/g, '\n').split(/^@@\s*/m).slice(1);
  for (const part of parts) {
    const lines = part.split('\n');
    const header = lines.shift();
    const m = header.match(/^(\d+)\s*\|\s*(.+?)\s*$/);
    if (!m) throw new Error(`${file}: zły nagłówek bloku "${header}"`);
    const day = parseInt(m[1], 10);
    const out = [];
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      let h;
      if ((h = line.match(/^%\s*(.+)$/)) || (h = line.match(/^##\s*(.+)$/))) {
        out.push({ type: 'h', text: h[1] });
      } else if ((h = line.match(/^(\d+[a-z]?)\s+(.+)$/))) {
        out.push({ type: 'v', num: h[1], text: h[2] });
      } else if (out.length && out[out.length - 1].type === 'v') {
        out[out.length - 1].text += ' ' + line;
      } else {
        throw new Error(`${file}: dzień ${day} – linia bez numeru wersetu: "${line.slice(0, 60)}"`);
      }
    }
    if (!out.some(o => o.type === 'v')) throw new Error(`${file}: dzień ${day} – brak wersetów`);
    if (blocks[day]) throw new Error(`${file}: zdublowany dzień ${day}`);
    blocks[day] = { label: m[2], items: out };
  }
  return blocks;
}

function renderItems(items) {
  return items.map(o => (o.type === 'h' ? `#### ${o.text}` : `**${o.num}** ${o.text}`)).join('\n\n');
}

function loadYear(y) {
  const file = path.join(ROOT, 'src', 'data', `bibliaYear${y}Data.ts`);
  const src = fs.readFileSync(file, 'utf8');
  const i = src.indexOf('= {') + 2;
  return { file, head: src.slice(0, i), data: JSON.parse(src.slice(i).replace(/;\s*$/, '')) };
}

const years = process.argv.slice(2).map(Number).filter(Boolean);
for (const y of (years.length ? years : [1, 2, 3, 4])) {
  const dir = path.join(TEXTS_DIR, `y${y}`);
  if (!fs.existsSync(dir)) continue;
  const { file, head, data } = loadYear(y);
  let merged = 0;
  for (const f of fs.readdirSync(dir).filter(n => n.endsWith('.txt')).sort()) {
    const blocks = parseTextFile(fs.readFileSync(path.join(dir, f), 'utf8'), f);
    for (const [dayStr, block] of Object.entries(blocks)) {
      const entry = data[dayStr];
      if (!entry) throw new Error(`${f}: brak dnia ${dayStr} w roku ${y}`);
      const labelChapter = parseInt((block.label.match(/(\d+)\s*$/) || [])[1], 10);
      if (labelChapter !== entry.chapter) {
        throw new Error(`${f}: dzień ${dayStr} – etykieta "${block.label}" nie pasuje do ${entry.bookTitle} ${entry.chapter}`);
      }
      const idx = entry.content.search(/\n##\s*2\.\s/);
      const scripture = idx === -1 ? entry.content : entry.content.slice(0, idx);
      const rest = idx === -1 ? '' : entry.content.slice(idx);
      const h3 = scripture.match(/^###\s.*$/m);
      if (!h3) throw new Error(`${f}: dzień ${dayStr} – brak nagłówka "###" w tekście`);
      const headPart = scripture.slice(0, h3.index + h3[0].length);
      entry.content = `${headPart}\n${renderItems(block.items)}\n\n---\n${rest}`;
      merged++;
    }
  }
  fs.writeFileSync(file, head + JSON.stringify(data, null, 2).replace(/\n/g, '\r\n') + ';\r\n', 'utf8');
  console.log(`Rok ${y}: podmieniono ${merged} tekstów`);
}
