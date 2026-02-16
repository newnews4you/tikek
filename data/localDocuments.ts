// === LOKALI DUOMENŲ SAUGYKLA ===
// Čia registruojami visi statiniai tekstai.

import { MATO_EVANGELIJA_TEXT } from './library/MatoEvangelija';
import { BIBLIJA_LT_KJV_2012_TEXT } from './library/Biblija-LT-KJV-2012';
import { KBK_FULL_TEXT } from './library/Katekizmas';
import { LUMEN_FIDEI_TEXT } from './library/LumenFidei';
import { FIDES_ET_RATIO_TEXT } from './library/FidesEtRatio';

const KBK_DOCUMENTS = KBK_FULL_TEXT.map(section => ({
  title: section.title.replace(' | KATEKIZMAS.LT', '').replace('. KBK', ''),
  type: "Katekizmas" as const,
  content: section.content
}));

export const LOCAL_DOCUMENTS = [
  {
    title: "Biblija (KJV Lietuviškai)",
    type: "Biblija" as const,
    content: BIBLIJA_LT_KJV_2012_TEXT
  },
  {
    title: "Evangelija pagal Matą",
    type: "Biblija" as const,
    content: MATO_EVANGELIJA_TEXT
  },
  // Įtraukiame visą Katekizmą
  ...KBK_DOCUMENTS,
  {
    title: "Enciklika Lumen Fidei",
    type: "Kita" as const,
    content: LUMEN_FIDEI_TEXT
  },
  {
    title: "Enciklika Fides et Ratio",
    type: "Kita" as const,
    content: FIDES_ET_RATIO_TEXT
  }
];
