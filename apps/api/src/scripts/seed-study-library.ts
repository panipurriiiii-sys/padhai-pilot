/**
 * seed-study-library.ts
 * ---------------------
 * One-off CLI seeder for platform-level LibraryMaterial rows.
 * Uses real, stable external URLs (NCERT, CBSE, state boards).
 *
 * Run (against a throwaway / staging database only – never production directly):
 *   DIRECT_URL=postgresql://... SEEDER_USER_ID=cuid_of_super_admin npx tsx src/scripts/seed-study-library.ts
 *
 * Records are upserted by (title + board + contentType) using a deterministic cuid2-like key built
 * from those three fields, so re-running is idempotent.
 */

import { PrismaClient } from '@prisma/client';

const DIRECT_URL = process.env.DIRECT_URL;
const SEEDER_USER_ID = process.env.SEEDER_USER_ID;

if (!DIRECT_URL) {
  console.error('ERROR: DIRECT_URL env var is required (direct postgres connection, not pooled).');
  process.exit(1);
}
if (!SEEDER_USER_ID) {
  console.error('ERROR: SEEDER_USER_ID env var is required (SUPER_ADMIN User.id).');
  process.exit(1);
}

const prisma = new PrismaClient({ datasourceUrl: DIRECT_URL });

interface SeedRecord {
  title: string;
  description?: string;
  board: string;
  classLevel?: string;
  subject?: string;
  contentType: string;
  externalUrl: string;
  yearOrEdition?: string;
  tags: string[];
}

const SEEDS: SeedRecord[] = [
  // ── NCERT CBSE Textbooks ──────────────────────────────────────────────────
  {
    title: 'NCERT Textbooks – All Classes (CBSE)',
    description: 'Official NCERT e-textbooks for Classes 1–12. Free PDF download from NCERT.',
    board: 'CBSE',
    contentType: 'TEXTBOOK',
    externalUrl: 'https://ncert.nic.in/textbook.php',
    yearOrEdition: '2024',
    tags: ['ncert', 'cbse', 'textbook', 'free'],
  },
  {
    title: 'NCERT Class 10 – Mathematics',
    description: 'NCERT Mathematics textbook for Class 10 (Real Numbers, Polynomials, Triangles, etc.)',
    board: 'CBSE',
    classLevel: '10',
    subject: 'Mathematics',
    contentType: 'TEXTBOOK',
    externalUrl: 'https://ncert.nic.in/textbook.php?jemh1=0-15',
    yearOrEdition: '2024',
    tags: ['ncert', 'cbse', 'class10', 'maths'],
  },
  {
    title: 'NCERT Class 10 – Science',
    description: 'NCERT Science textbook for Class 10 (Chemical Reactions, Biology, Physics)',
    board: 'CBSE',
    classLevel: '10',
    subject: 'Science',
    contentType: 'TEXTBOOK',
    externalUrl: 'https://ncert.nic.in/textbook.php?jesc1=0-16',
    yearOrEdition: '2024',
    tags: ['ncert', 'cbse', 'class10', 'science'],
  },
  {
    title: 'NCERT Class 10 – Social Science (India & Contemporary World)',
    board: 'CBSE',
    classLevel: '10',
    subject: 'Social Science',
    contentType: 'TEXTBOOK',
    externalUrl: 'https://ncert.nic.in/textbook.php?jess3=0-5',
    yearOrEdition: '2024',
    tags: ['ncert', 'cbse', 'class10', 'sst', 'history'],
  },
  {
    title: 'NCERT Class 12 – Physics Part 1',
    description: 'Electrostatics, Current Electricity, Magnetism',
    board: 'CBSE',
    classLevel: '12',
    subject: 'Physics',
    contentType: 'TEXTBOOK',
    externalUrl: 'https://ncert.nic.in/textbook.php?leph1=0-9',
    yearOrEdition: '2024',
    tags: ['ncert', 'cbse', 'class12', 'physics'],
  },
  {
    title: 'NCERT Class 12 – Physics Part 2',
    description: 'Optics, Dual Nature, Atoms, Semiconductors',
    board: 'CBSE',
    classLevel: '12',
    subject: 'Physics',
    contentType: 'TEXTBOOK',
    externalUrl: 'https://ncert.nic.in/textbook.php?leph2=0-9',
    yearOrEdition: '2024',
    tags: ['ncert', 'cbse', 'class12', 'physics'],
  },
  {
    title: 'NCERT Class 12 – Chemistry Part 1',
    board: 'CBSE',
    classLevel: '12',
    subject: 'Chemistry',
    contentType: 'TEXTBOOK',
    externalUrl: 'https://ncert.nic.in/textbook.php?lech1=0-9',
    yearOrEdition: '2024',
    tags: ['ncert', 'cbse', 'class12', 'chemistry'],
  },
  {
    title: 'NCERT Class 12 – Chemistry Part 2',
    board: 'CBSE',
    classLevel: '12',
    subject: 'Chemistry',
    contentType: 'TEXTBOOK',
    externalUrl: 'https://ncert.nic.in/textbook.php?lech2=0-9',
    yearOrEdition: '2024',
    tags: ['ncert', 'cbse', 'class12', 'chemistry'],
  },
  {
    title: 'NCERT Class 12 – Mathematics Part 1',
    board: 'CBSE',
    classLevel: '12',
    subject: 'Mathematics',
    contentType: 'TEXTBOOK',
    externalUrl: 'https://ncert.nic.in/textbook.php?lemh1=0-6',
    yearOrEdition: '2024',
    tags: ['ncert', 'cbse', 'class12', 'maths'],
  },
  {
    title: 'NCERT Class 12 – Mathematics Part 2',
    board: 'CBSE',
    classLevel: '12',
    subject: 'Mathematics',
    contentType: 'TEXTBOOK',
    externalUrl: 'https://ncert.nic.in/textbook.php?lemh2=0-6',
    yearOrEdition: '2024',
    tags: ['ncert', 'cbse', 'class12', 'maths'],
  },
  {
    title: 'NCERT Class 12 – Biology',
    board: 'CBSE',
    classLevel: '12',
    subject: 'Biology',
    contentType: 'TEXTBOOK',
    externalUrl: 'https://ncert.nic.in/textbook.php?lebo1=0-16',
    yearOrEdition: '2024',
    tags: ['ncert', 'cbse', 'class12', 'biology'],
  },
  {
    title: 'NCERT Class 11 – Physics Part 1',
    board: 'CBSE',
    classLevel: '11',
    subject: 'Physics',
    contentType: 'TEXTBOOK',
    externalUrl: 'https://ncert.nic.in/textbook.php?keph1=0-8',
    yearOrEdition: '2024',
    tags: ['ncert', 'cbse', 'class11', 'physics'],
  },
  {
    title: 'NCERT Class 9 – Mathematics',
    board: 'CBSE',
    classLevel: '9',
    subject: 'Mathematics',
    contentType: 'TEXTBOOK',
    externalUrl: 'https://ncert.nic.in/textbook.php?iemh1=0-15',
    yearOrEdition: '2024',
    tags: ['ncert', 'cbse', 'class9', 'maths'],
  },
  {
    title: 'NCERT Class 8 – Science',
    board: 'CBSE',
    classLevel: '8',
    subject: 'Science',
    contentType: 'TEXTBOOK',
    externalUrl: 'https://ncert.nic.in/textbook.php?hesc1=0-18',
    yearOrEdition: '2024',
    tags: ['ncert', 'cbse', 'class8', 'science'],
  },
  // ── CBSE Question Papers ──────────────────────────────────────────────────
  {
    title: 'CBSE Board Question Papers – Class 10 & 12',
    description: 'Official CBSE previous year question papers (2010 onwards) for all major subjects.',
    board: 'CBSE',
    contentType: 'QUESTION_PAPER',
    externalUrl: 'https://cbse.gov.in/cbsenew/question-paper.html',
    tags: ['cbse', 'question-paper', 'previous-year', 'board-exam'],
  },
  {
    title: 'CBSE Sample Question Papers 2024–25',
    description: 'CBSE Sample papers for the 2024-25 board examination cycle.',
    board: 'CBSE',
    contentType: 'QUESTION_PAPER',
    externalUrl: 'https://cbseacademic.nic.in/SQP_CLASSXII_2024-25.html',
    yearOrEdition: '2024-25',
    tags: ['cbse', 'sample-paper', 'class12', 'board-exam'],
  },
  // ── NCERT Solutions ───────────────────────────────────────────────────────
  {
    title: 'NCERT Official Portal – Solutions & Study Material',
    description: 'NCERT official website with NCERT Solutions, exemplar problems and additional resources.',
    board: 'CBSE',
    contentType: 'SOLUTION',
    externalUrl: 'https://ncert.nic.in/',
    tags: ['ncert', 'cbse', 'solutions', 'exemplar'],
  },
  // ── RBSE Rajasthan ────────────────────────────────────────────────────────
  {
    title: 'RBSE Official Portal – Rajasthan Board',
    description: 'Rajasthan Board of Secondary Education: results, model papers, syllabus.',
    board: 'RBSE',
    contentType: 'SYLLABUS',
    externalUrl: 'https://rajeduboard.rajasthan.gov.in/',
    tags: ['rbse', 'rajasthan', 'board'],
  },
  {
    title: 'RBSE Model Question Papers',
    board: 'RBSE',
    contentType: 'QUESTION_PAPER',
    externalUrl: 'https://rajeduboard.rajasthan.gov.in/modelpapers.aspx',
    tags: ['rbse', 'rajasthan', 'model-paper', 'question-paper'],
  },
  // ── Maharashtra SSC / HSC ─────────────────────────────────────────────────
  {
    title: 'Maharashtra SSC & HSC Board – Official Portal',
    description: 'Maharashtra State Board of Secondary and Higher Secondary Education',
    board: 'MH_SSC',
    contentType: 'SYLLABUS',
    externalUrl: 'https://www.mahahsscboard.in/',
    tags: ['maharashtra', 'mh-ssc', 'mh-hsc', 'board'],
  },
  {
    title: 'Maharashtra SSC Question Papers',
    board: 'MH_SSC',
    contentType: 'QUESTION_PAPER',
    externalUrl: 'https://www.mahahsscboard.in/questionpaper.aspx',
    tags: ['maharashtra', 'ssc', 'question-paper'],
  },
  {
    title: 'Maharashtra HSC Question Papers',
    board: 'MH_HSC',
    contentType: 'QUESTION_PAPER',
    externalUrl: 'https://www.mahahsscboard.in/questionpaper.aspx',
    tags: ['maharashtra', 'hsc', 'question-paper', 'class12'],
  },
  // ── UP Board ──────────────────────────────────────────────────────────────
  {
    title: 'UP Board (UPMSP) – Official Portal',
    description: 'Uttar Pradesh Madhyamik Shiksha Parishad – syllabus, model papers, results.',
    board: 'UPMSP',
    contentType: 'SYLLABUS',
    externalUrl: 'https://upmsp.edu.in/',
    tags: ['up-board', 'upmsp', 'uttar-pradesh'],
  },
  {
    title: 'UP Board Model Papers Class 10 & 12',
    board: 'UPMSP',
    contentType: 'QUESTION_PAPER',
    externalUrl: 'https://upmsp.edu.in/ModelPaper.aspx',
    tags: ['up-board', 'upmsp', 'model-paper', 'question-paper'],
  },
  // ── West Bengal WBBSE ─────────────────────────────────────────────────────
  {
    title: 'WBBSE (West Bengal) – Official Portal',
    description: 'West Bengal Board of Secondary Education – syllabi, question papers.',
    board: 'WBBSE',
    contentType: 'SYLLABUS',
    externalUrl: 'https://wbbse.wb.gov.in/',
    tags: ['wbbse', 'west-bengal', 'wb-board'],
  },
  {
    title: 'WBBSE Madhyamik Sample Question Papers',
    board: 'WBBSE',
    contentType: 'QUESTION_PAPER',
    externalUrl: 'https://wbbse.wb.gov.in/index.php/sample-question-paper',
    tags: ['wbbse', 'west-bengal', 'madhyamik', 'question-paper'],
  },
  // ── Bihar BSEB ────────────────────────────────────────────────────────────
  {
    title: 'Bihar Board (BSEB) – Official Portal',
    description: 'Bihar School Examination Board – model sets, syllabus, results.',
    board: 'BSEB',
    contentType: 'SYLLABUS',
    externalUrl: 'https://biharboardonline.com/',
    tags: ['bseb', 'bihar-board', 'bihar'],
  },
  {
    title: 'BSEB Model Set Papers Class 10',
    board: 'BSEB',
    classLevel: '10',
    contentType: 'QUESTION_PAPER',
    externalUrl: 'https://biharboardonline.com/question-paper/',
    tags: ['bseb', 'bihar', 'class10', 'question-paper'],
  },
  // ── Gujarat GSEB ──────────────────────────────────────────────────────────
  {
    title: 'Gujarat Board (GSEB) – Official Portal',
    description: 'Gujarat Secondary and Higher Secondary Education Board – papers, syllabus.',
    board: 'GSEB',
    contentType: 'SYLLABUS',
    externalUrl: 'https://gseb.org/',
    tags: ['gseb', 'gujarat-board', 'gujarat'],
  },
  {
    title: 'GSEB SSC & HSC Question Papers',
    board: 'GSEB',
    contentType: 'QUESTION_PAPER',
    externalUrl: 'https://gseb.org/question_papers.aspx',
    tags: ['gseb', 'gujarat', 'ssc', 'hsc', 'question-paper'],
  },
  // ── HP Board ──────────────────────────────────────────────────────────────
  {
    title: 'HP Board (HPBOSE) – Official Portal',
    description: 'Himachal Pradesh Board of School Education',
    board: 'HPBSE',
    contentType: 'SYLLABUS',
    externalUrl: 'https://www.hpbose.org/',
    tags: ['hpbse', 'hp-board', 'himachal'],
  },
  {
    title: 'HPBOSE Model Answer Papers',
    board: 'HPBSE',
    contentType: 'QUESTION_PAPER',
    externalUrl: 'https://www.hpbose.org/ModelAnswerPapers.aspx',
    tags: ['hpbse', 'himachal', 'question-paper', 'model-paper'],
  },
  // ── Punjab PSEB ───────────────────────────────────────────────────────────
  {
    title: 'Punjab Board (PSEB) – Official Portal',
    description: 'Punjab School Education Board – past papers, syllabi, results.',
    board: 'PSEB',
    contentType: 'SYLLABUS',
    externalUrl: 'https://pseb.ac.in/',
    tags: ['pseb', 'punjab-board', 'punjab'],
  },
  {
    title: 'PSEB Previous Year Question Papers',
    board: 'PSEB',
    contentType: 'QUESTION_PAPER',
    externalUrl: 'https://pseb.ac.in/question-paper/',
    tags: ['pseb', 'punjab', 'question-paper', 'previous-year'],
  },
  // ── MP Board ──────────────────────────────────────────────────────────────
  {
    title: 'MP Board (MPBSE) – Official Portal',
    description: 'Madhya Pradesh Board of Secondary Education – model papers, syllabus, results.',
    board: 'MPBSE',
    contentType: 'SYLLABUS',
    externalUrl: 'https://mpbse.nic.in/',
    tags: ['mpbse', 'mp-board', 'madhya-pradesh'],
  },
  {
    title: 'MP Board Model Papers Class 10 & 12',
    board: 'MPBSE',
    contentType: 'QUESTION_PAPER',
    externalUrl: 'https://mpbse.nic.in/model_papers.aspx',
    tags: ['mpbse', 'madhya-pradesh', 'model-paper', 'question-paper'],
  },
  // ── ICSE / ISC ────────────────────────────────────────────────────────────
  {
    title: 'ICSE / ISC – Official CISCE Portal',
    description: 'Council for the Indian School Certificate Examinations – syllabi, specimen papers.',
    board: 'ICSE',
    contentType: 'SYLLABUS',
    externalUrl: 'https://www.cisce.org/',
    tags: ['icse', 'isc', 'cisce', 'board'],
  },
  {
    title: 'ICSE Class 10 Specimen Papers 2024',
    board: 'ICSE',
    classLevel: '10',
    contentType: 'QUESTION_PAPER',
    externalUrl: 'https://www.cisce.org/SpecimenPapers.aspx',
    yearOrEdition: '2024',
    tags: ['icse', 'class10', 'specimen-paper', 'question-paper'],
  },
  {
    title: 'ISC Class 12 Specimen Papers 2024',
    board: 'ICSE',
    classLevel: '12',
    contentType: 'QUESTION_PAPER',
    externalUrl: 'https://www.cisce.org/SpecimenPapers.aspx',
    yearOrEdition: '2024',
    tags: ['isc', 'class12', 'specimen-paper', 'question-paper'],
  },
  // ── General / Multi-board ─────────────────────────────────────────────────
  {
    title: 'NCERT Exemplar Problems – All Subjects',
    description: 'NCERT Exemplar problems for Maths, Science, Physics, Chemistry, Biology.',
    board: 'CBSE',
    contentType: 'NOTES',
    externalUrl: 'https://ncert.nic.in/exemplar-problems.php',
    tags: ['ncert', 'exemplar', 'practice', 'cbse'],
  },
  {
    title: 'CBSE Curriculum / Syllabus 2024–25',
    description: 'Official CBSE curriculum documents for all classes and subjects.',
    board: 'CBSE',
    contentType: 'SYLLABUS',
    externalUrl: 'https://cbseacademic.nic.in/Curriculum_2024-25.html',
    yearOrEdition: '2024-25',
    tags: ['cbse', 'syllabus', 'curriculum', 'official'],
  },
];

async function main() {
  console.log(`Seeding ${SEEDS.length} LibraryMaterial records (platform-level)…`);
  let upserted = 0;
  let skipped = 0;

  for (const seed of SEEDS) {
    try {
      // Build a stable deterministic ID from title+board+contentType
      const stableKey = Buffer.from(`${seed.title}||${seed.board}||${seed.contentType}`).toString('base64url').slice(0, 25);
      const id = `lib_${stableKey}`.slice(0, 30);

      await prisma.libraryMaterial.upsert({
        where: { id },
        create: {
          id,
          title: seed.title,
          description: seed.description,
          board: seed.board,
          classLevel: seed.classLevel,
          subject: seed.subject,
          contentType: seed.contentType,
          externalUrl: seed.externalUrl,
          yearOrEdition: seed.yearOrEdition,
          tags: seed.tags,
          instituteId: null, // platform-level
          uploadedBy: SEEDER_USER_ID as string,
          isApproved: true,
        },
        update: {
          title: seed.title,
          description: seed.description,
          externalUrl: seed.externalUrl,
          yearOrEdition: seed.yearOrEdition,
          tags: seed.tags,
          isApproved: true,
        },
      });
      upserted++;
    } catch (err) {
      console.error(`Failed to upsert "${seed.title}":`, err);
      skipped++;
    }
  }

  console.log(`Done. Upserted: ${upserted}, Skipped/failed: ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
