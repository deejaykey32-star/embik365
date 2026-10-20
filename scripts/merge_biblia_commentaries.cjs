// Scala indywidualne komentarze do rozdziałów (scripts/biblia_komentarze/y{1..4}/*.txt)
// z danymi Biblia365 (src/data/bibliaYear{1..4}Data.ts).
//
// Każdy plik zawiera bloki:
//   @@ <dzień> | <księga> <rozdział>
//   K: miejsce rozdziału w księdze
//   P: przebieg rozdziału
//   H: perspektywa historyczno-kulturowa
//   T: perspektywa teologiczna
//   O: głos Tradycji i Kościoła
//   D: perspektywa duchowa i życiowa
//   Q: pytanie 1 || pytanie 2 || pytanie 3
//   M: modlitwa
//
// Tekst biblijny (sekcja 1) pozostaje bez zmian; sekcje 2+ są zastępowane nowym komentarzem.
// Użycie: node scripts/merge_biblia_commentaries.cjs [rok...]

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const COMMENTS_DIR = path.join(__dirname, 'biblia_komentarze');

const SECTIONS = [
  ['K', 'Miejsce rozdziału w księdze'],
  ['P', 'Przebieg rozdziału krok po kroku'],
  ['H', 'Perspektywa historyczno-kulturowa'],
  ['T', 'Perspektywa teologiczna'],
  ['O', 'Głos Tradycji i Kościoła'],
  ['D', 'Perspektywa duchowa i życiowa'],
  ['Q', 'Pytania do rozważania'],
  ['M', 'Modlitwa']
];

function parseCommentFile(text, file) {
  const blocks = {};
  const parts = text.replace(/\r\n/g, '\n').split(/^@@\s*/m).slice(1);
  for (const part of parts) {
    const lines = part.split('\n');
    const header = lines.shift();
    const m = header.match(/^(\d+)\s*\|\s*(.+?)\s*$/);
    if (!m) throw new Error(`${file}: zły nagłówek bloku "${header}"`);
    const day = parseInt(m[1], 10);
    const fields = {};
    let cur = null;
    for (const line of lines) {
      const f = line.match(/^([KPHTODQM]):\s*(.*)$/);
      if (f) {
        cur = f[1];
        fields[cur] = f[2].trim();
      } else if (cur && line.trim()) {
        fields[cur] += ' ' + line.trim();
      }
    }
    for (const [key] of SECTIONS) {
      if (!fields[key]) throw new Error(`${file}: dzień ${day} – brak pola ${key}`);
    }
    if (blocks[day]) throw new Error(`${file}: zdublowany dzień ${day}`);
    blocks[day] = { label: m[2], fields };
  }
  return blocks;
}

function buildMarkdown(fields) {
  const out = [];
  SECTIONS.forEach(([key, title], i) => {
    const num = i + 2;
    let body = fields[key];
    if (key === 'Q') {
      body = body.split('||').map(q => q.trim()).filter(Boolean).map((q, qi) => `${qi + 1}. ${q}`).join('\n');
    } else if (key === 'M') {
      body = `*${body.replace(/^\*|\*$/g, '')}*`;
    }
    out.push(`## ${num}. ${title}\n\n${body}`);
  });
  return out.join('\n\n---\n\n');
}

function loadYear(y) {
  const file = path.join(ROOT, 'src', 'data', `bibliaYear${y}Data.ts`);
  const src = fs.readFileSync(file, 'utf8');
  const i = src.indexOf('= {') + 2;
  return { file, head: src.slice(0, i), data: JSON.parse(src.slice(i).replace(/;\s*$/, '')) };
}

const years = process.argv.slice(2).map(Number).filter(Boolean);
for (const y of (years.length ? years : [1, 2, 3, 4])) {
  const dir = path.join(COMMENTS_DIR, `y${y}`);
  if (!fs.existsSync(dir)) continue;
  const { file, head, data } = loadYear(y);
  let merged = 0;
  for (const f of fs.readdirSync(dir).filter(n => n.endsWith('.txt')).sort()) {
    const blocks = parseCommentFile(fs.readFileSync(path.join(dir, f), 'utf8'), f);
    for (const [dayStr, block] of Object.entries(blocks)) {
      const entry = data[dayStr];
      if (!entry) throw new Error(`${f}: brak dnia ${dayStr} w roku ${y}`);
      const labelChapter = parseInt((block.label.match(/(\d+)\s*$/) || [])[1], 10);
      if (labelChapter !== entry.chapter) {
        throw new Error(`${f}: dzień ${dayStr} – etykieta "${block.label}" nie pasuje do ${entry.bookTitle} ${entry.chapter}`);
      }
      const idx = entry.content.search(/\n##\s*2\.\s/);
      const scripture = (idx === -1 ? entry.content : entry.content.slice(0, idx)).replace(/\s*(---\s*)?$/, '');
      entry.content = `${scripture}\n\n---\n\n${buildMarkdown(block.fields)}`;
      merged++;
    }
  }
  fs.writeFileSync(file, head + JSON.stringify(data, null, 2).replace(/\n/g, '\r\n') + ';\r\n', 'utf8');
  console.log(`Rok ${y}: scalono ${merged} komentarzy`);
}
