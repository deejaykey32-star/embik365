import fs from 'fs';
import { stage1 } from './data_cycle2_stage1.mjs';
import { stage2 } from './data_cycle2_stage2.mjs';
import { stage3 } from './data_cycle2_stage3.mjs';
import { stage4 } from './data_cycle2_stage4.mjs';
import { stage5 } from './data_cycle2_stage5.mjs';
import { stage6 } from './data_cycle2_stage6.mjs';
import { stage7 } from './data_cycle2_stage7.mjs';

const allStages = [stage1, stage2, stage3, stage4, stage5, stage6, stage7];

console.log('Validating stages and building Cycle 2 mysteries array...');

let globalDay = 1;
const mysteries = [];

for (const st of allStages) {
  if (st.parts.length !== 5) {
    throw new Error(`Stage ${st.stage} (${st.stageTitle}) does not have 5 parts! Found ${st.parts.length}`);
  }
  for (const pt of st.parts) {
    if (pt.mysteries.length !== 5) {
      throw new Error(`Stage ${st.stage}, Part ${pt.part} (${pt.partTitle}) does not have 5 mysteries! Found ${pt.mysteries.length}`);
    }
    for (const m of pt.mysteries) {
      if (!m.cl || m.cl.length !== 10) {
        throw new Error(`Stage ${st.stage}, Part ${pt.part}, Mystery "${m.t}" does not have 10 cl clauses! Found ${m.cl?.length}`);
      }
      mysteries.push({
        day: globalDay,
        cycle: 2,
        t: m.t,
        sub: m.sub,
        ref: m.ref,
        passage: m.passage,
        med: m.med,
        cl: m.cl,
        stage: st.stage,
        stageTitle: st.stageTitle,
        part: pt.part,
        partTitle: pt.partTitle,
        inPart: m.inPart,
        prayer: pt.prayer
      });
      globalDay++;
    }
  }
}

console.log(`Successfully built ${mysteries.length} mysteries for Cycle 2 (expected 175).`);

if (mysteries.length !== 175) {
  throw new Error(`Expected exactly 175 mysteries, but got ${mysteries.length}`);
}

const fileHeader = `// Auto-generated 175-day dataset for Nowy Różaniec Historii Zbawienia — CYKL 2
// Cykl 2 trwa 175 dni (od 25 czerwca do 16 grudnia).
// 7 etapów x 5 części x 5 tajemnic = 175 dni.
import { NowyRhzMystery } from './nowyRhzData';

export const NOWY_RHZ_CYCLE_2_MYSTERIES: NowyRhzMystery[] = ${JSON.stringify(mysteries, null, 2)};
`;

fs.writeFileSync('src/data/nowyRhzCycle2Data.ts', fileHeader, 'utf8');
console.log('Saved src/data/nowyRhzCycle2Data.ts successfully!');
