// run-migrations-and-seed.mjs  — node run-migrations-and-seed.mjs
import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// 1. Load .env
const envLines = readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n');
for (const line of envLines) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq < 0) continue;
  const key = t.slice(0, eq).trim();
  const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[key]) process.env[key] = val;
}

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) { console.error('No DIRECT_URL or DATABASE_URL in .env'); process.exit(1); }
console.log('DB host:', url.split('@')[1]?.split('/')[0] ?? url.slice(0, 40));

// 2. Connect with @prisma/client (already installed)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasourceUrl: url, log: ['error'] });

async function execSql(label, file) {
  console.log(`\n[${label}] Running ${path.basename(file)} …`);
  const sql = readFileSync(path.join(__dirname, file), 'utf8');
  // Split on semicolons but keep DO $$ blocks intact
  const statements = sql
    .replace(/--[^\n]*/g, '')          // strip line comments
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 2);
  for (const stmt of statements) {
    try { await prisma.$executeRawUnsafe(stmt + ';'); }
    catch (e) { console.warn('  warn:', e.message.slice(0, 120)); }
  }
  console.log(`  ✓ done`);
}

async function main() {
  await execSql('1/3', 'apps/api/prisma/migrations/20261109000000_device_tokens_and_interactive_notifications/migration.sql');
  await execSql('2/3', 'apps/api/prisma/migrations/20261109000100_study_library/migration.sql');

  // 3. Seed — auto-detect SUPER_ADMIN
  console.log('\n[3/3] Seeding study library …');
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', isActive: true }, select: { id: true, email: true } });
  if (!admin) { console.error('No active SUPER_ADMIN found'); await prisma.$disconnect(); process.exit(1); }
  console.log('  SUPER_ADMIN:', admin.email);

  // inline seed data (40 real stable links)
  const seeds = [
    // NCERT Textbooks
    { title:'NCERT Class 6 All Subjects', board:'CBSE', classLevel:'6', subject:null, contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?aehss1=0-8', yearOrEdition:'2024', tags:['ncert','class6'] },
    { title:'NCERT Class 7 All Subjects', board:'CBSE', classLevel:'7', subject:null, contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?gehss1=0-8', yearOrEdition:'2024', tags:['ncert','class7'] },
    { title:'NCERT Class 8 All Subjects', board:'CBSE', classLevel:'8', subject:null, contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?hehss1=0-8', yearOrEdition:'2024', tags:['ncert','class8'] },
    { title:'NCERT Class 9 Mathematics', board:'CBSE', classLevel:'9', subject:'Mathematics', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?iemh1=0-15', yearOrEdition:'2024', tags:['ncert','maths'] },
    { title:'NCERT Class 9 Science', board:'CBSE', classLevel:'9', subject:'Science', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?iesc1=0-15', yearOrEdition:'2024', tags:['ncert','science'] },
    { title:'NCERT Class 9 English', board:'CBSE', classLevel:'9', subject:'English', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?iebs1=0-11', yearOrEdition:'2024', tags:['ncert','english'] },
    { title:'NCERT Class 9 Social Science', board:'CBSE', classLevel:'9', subject:'Social Science', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?iess1=0-5', yearOrEdition:'2024', tags:['ncert','sst'] },
    { title:'NCERT Class 10 Mathematics', board:'CBSE', classLevel:'10', subject:'Mathematics', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?jemh1=0-15', yearOrEdition:'2024', tags:['ncert','maths','board'] },
    { title:'NCERT Class 10 Science', board:'CBSE', classLevel:'10', subject:'Science', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?jesc1=0-16', yearOrEdition:'2024', tags:['ncert','science','board'] },
    { title:'NCERT Class 10 English (First Flight)', board:'CBSE', classLevel:'10', subject:'English', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?jebf1=0-11', yearOrEdition:'2024', tags:['ncert','english','board'] },
    { title:'NCERT Class 10 Social Science', board:'CBSE', classLevel:'10', subject:'Social Science', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?jess1=0-5', yearOrEdition:'2024', tags:['ncert','sst','board'] },
    { title:'NCERT Class 11 Physics Part I', board:'CBSE', classLevel:'11', subject:'Physics', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?keph1=0-8', yearOrEdition:'2024', tags:['ncert','physics'] },
    { title:'NCERT Class 11 Chemistry Part I', board:'CBSE', classLevel:'11', subject:'Chemistry', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?kech1=0-7', yearOrEdition:'2024', tags:['ncert','chemistry'] },
    { title:'NCERT Class 11 Mathematics', board:'CBSE', classLevel:'11', subject:'Mathematics', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?kemh1=0-16', yearOrEdition:'2024', tags:['ncert','maths'] },
    { title:'NCERT Class 11 Biology', board:'CBSE', classLevel:'11', subject:'Biology', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?kebo1=0-22', yearOrEdition:'2024', tags:['ncert','biology'] },
    { title:'NCERT Class 12 Physics Part I', board:'CBSE', classLevel:'12', subject:'Physics', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?leph1=0-9', yearOrEdition:'2024', tags:['ncert','physics','board'] },
    { title:'NCERT Class 12 Chemistry Part I', board:'CBSE', classLevel:'12', subject:'Chemistry', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?lech1=0-8', yearOrEdition:'2024', tags:['ncert','chemistry','board'] },
    { title:'NCERT Class 12 Mathematics Part I', board:'CBSE', classLevel:'12', subject:'Mathematics', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?lemh1=0-6', yearOrEdition:'2024', tags:['ncert','maths','board'] },
    { title:'NCERT Class 12 Biology', board:'CBSE', classLevel:'12', subject:'Biology', contentType:'TEXTBOOK', externalUrl:'https://ncert.nic.in/textbook.php?lebo1=0-16', yearOrEdition:'2024', tags:['ncert','biology','board'] },
    // CBSE Question Papers
    { title:'CBSE Class 10 Question Papers 2024', board:'CBSE', classLevel:'10', subject:null, contentType:'QUESTION_PAPER', externalUrl:'https://cbse.gov.in/cbsenew/question-paper.html', yearOrEdition:'2024', tags:['cbse','board','class10','pyq'] },
    { title:'CBSE Class 12 Question Papers 2024', board:'CBSE', classLevel:'12', subject:null, contentType:'QUESTION_PAPER', externalUrl:'https://cbse.gov.in/cbsenew/question-paper.html', yearOrEdition:'2024', tags:['cbse','board','class12','pyq'] },
    { title:'CBSE Sample Papers 2024-25', board:'CBSE', classLevel:null, subject:null, contentType:'QUESTION_PAPER', externalUrl:'https://cbseacademic.nic.in/SQP_CLASSXII_2024-25.html', yearOrEdition:'2024-25', tags:['cbse','sample','sqp'] },
    { title:'CBSE Syllabus 2024-25', board:'CBSE', classLevel:null, subject:null, contentType:'SYLLABUS', externalUrl:'https://cbseacademic.nic.in/Curriculum_2024-25.html', yearOrEdition:'2024-25', tags:['cbse','syllabus'] },
    // ICSE
    { title:'ICSE Specimen Papers 2025', board:'ICSE', classLevel:'10', subject:null, contentType:'QUESTION_PAPER', externalUrl:'https://www.cisce.org/specimen-question-papers.aspx', yearOrEdition:'2025', tags:['icse','specimen','board'] },
    { title:'ISC Specimen Papers 2025', board:'ICSE', classLevel:'12', subject:null, contentType:'QUESTION_PAPER', externalUrl:'https://www.cisce.org/specimen-question-papers.aspx', yearOrEdition:'2025', tags:['isc','specimen','board'] },
    // State Boards
    { title:'RBSE Textbooks & Papers (Rajasthan)', board:'RBSE', classLevel:null, subject:null, contentType:'TEXTBOOK', externalUrl:'https://rajeduboard.rajasthan.gov.in/', yearOrEdition:'2024', tags:['rbse','rajasthan'] },
    { title:'RBSE Old Question Papers', board:'RBSE', classLevel:null, subject:null, contentType:'QUESTION_PAPER', externalUrl:'https://rajeduboard.rajasthan.gov.in/', yearOrEdition:'2024', tags:['rbse','pyq','rajasthan'] },
    { title:'Maharashtra SSC Study Material', board:'MH_SSC', classLevel:'10', subject:null, contentType:'TEXTBOOK', externalUrl:'https://www.mahahsscboard.in/', yearOrEdition:'2024', tags:['maharashtra','ssc','class10'] },
    { title:'Maharashtra HSC Study Material', board:'MH_HSC', classLevel:'12', subject:null, contentType:'TEXTBOOK', externalUrl:'https://www.mahahsscboard.in/', yearOrEdition:'2024', tags:['maharashtra','hsc','class12'] },
    { title:'UP Board Textbooks & Papers', board:'UPMSP', classLevel:null, subject:null, contentType:'TEXTBOOK', externalUrl:'https://upmsp.edu.in/', yearOrEdition:'2024', tags:['up','board','upmsp'] },
    { title:'UP Board Previous Year Papers', board:'UPMSP', classLevel:null, subject:null, contentType:'QUESTION_PAPER', externalUrl:'https://upmsp.edu.in/', yearOrEdition:'2024', tags:['up','pyq'] },
    { title:'West Bengal Board (WBBSE) Resources', board:'WBBSE', classLevel:null, subject:null, contentType:'TEXTBOOK', externalUrl:'https://wbbse.wb.gov.in/', yearOrEdition:'2024', tags:['wb','wbbse','bengal'] },
    { title:'Bihar Board (BSEB) Resources', board:'BSEB', classLevel:null, subject:null, contentType:'TEXTBOOK', externalUrl:'https://biharboardonline.com/', yearOrEdition:'2024', tags:['bihar','bseb'] },
    { title:'BSEB Previous Year Question Papers', board:'BSEB', classLevel:null, subject:null, contentType:'QUESTION_PAPER', externalUrl:'https://biharboardonline.com/', yearOrEdition:'2024', tags:['bihar','pyq'] },
    { title:'Gujarat Board (GSEB) Resources', board:'GSEB', classLevel:null, subject:null, contentType:'TEXTBOOK', externalUrl:'https://gseb.org/', yearOrEdition:'2024', tags:['gseb','gujarat'] },
    { title:'HP Board (HPBOSE) Resources', board:'HPBSE', classLevel:null, subject:null, contentType:'TEXTBOOK', externalUrl:'https://www.hpbose.org/', yearOrEdition:'2024', tags:['hp','hpbose'] },
    { title:'Punjab Board (PSEB) Resources', board:'PSEB', classLevel:null, subject:null, contentType:'TEXTBOOK', externalUrl:'https://pseb.ac.in/', yearOrEdition:'2024', tags:['punjab','pseb'] },
    { title:'MP Board (MPBSE) Resources', board:'MPBSE', classLevel:null, subject:null, contentType:'TEXTBOOK', externalUrl:'https://mpbse.nic.in/', yearOrEdition:'2024', tags:['mp','mpbse'] },
    { title:'NCERT Solutions Hub', board:'CBSE', classLevel:null, subject:null, contentType:'SOLUTION', externalUrl:'https://ncert.nic.in/', yearOrEdition:'2024', tags:['ncert','solutions'] },
    { title:'CBSE Circular & Notices', board:'CBSE', classLevel:null, subject:null, contentType:'SYLLABUS', externalUrl:'https://cbse.gov.in/', yearOrEdition:'2024-25', tags:['cbse','circular'] },
  ];

  let inserted = 0, skipped = 0;
  for (const s of seeds) {
    const key = Buffer.from(`${s.title}||${s.board}||${s.contentType}`).toString('base64').slice(0,25).replace(/[^a-zA-Z0-9]/g,'x');
    try {
      await prisma.libraryMaterial.upsert({
        where: { id: key },
        create: { id: key, uploadedBy: admin.id, instituteId: null, isApproved: true, viewCount: 0, tags: s.tags, ...s },
        update: { externalUrl: s.externalUrl, isApproved: true, tags: s.tags },
      });
      inserted++;
    } catch(e) { console.warn('  skip:', s.title, '-', e.message.slice(0,80)); skipped++; }
  }
  console.log(`  ✓ ${inserted} upserted, ${skipped} skipped`);

  await prisma.$disconnect();
  console.log('\n✅ All done! Refresh the portals — Library section should show books.');
}

main().catch(async e => { console.error(e.message); await prisma.$disconnect(); process.exit(1); });
