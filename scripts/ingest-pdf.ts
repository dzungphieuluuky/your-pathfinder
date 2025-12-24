import fs from 'fs';
import path from 'path';
import { generateEmbedding } from '../lib/embeddings';
import { getServiceSupabase } from '../lib/supabase';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const pdfParse = require('pdf-parse');

const supabase = getServiceSupabase();
const docDir = process.env.WATCHED_DIR || './documents';

async function ingestPdf(filePath: string) {
  const fileName = path.basename(filePath);
  console.info(`--- Đang xử lý: ${fileName} ---`);

  let category = 'General';
  const upperName = fileName.toUpperCase();
  if (upperName.includes('HR')) category = 'HR';
  else if (upperName.includes('IT')) category = 'IT';
  else if (upperName.includes('SALES')) category = 'Sales';

  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    // Split text by pages (approximate - pdf-parse doesn't give exact pages)
    const text = pdfData.text;
    if (!text || !text.trim()) {
      console.warn(`⚠️ File trống: ${fileName}`);
      return;
    }

    // For better page-by-page processing, we'll split by page breaks
    // specify data type for pages
    const pages = text.split('\f').filter((p: string) => p.trim());

    console.info(`📄 Tìm thấy ${pages.length} trang trong ${fileName}`);

    for (let i = 0; i < pages.length; i++) {
      const pageText =   pages[i].trim();
      if (!pageText) continue;

      console.info(`  Đang xử lý trang ${i + 1}/${pages.length}...`);

      // Generate embedding for this page
      const embedding = await generateEmbedding(pageText);

      // Insert into database
      const { error } = await supabase
        .from('knowledge_embeddings')
        .insert({
          content: pageText,
          embedding,
          category,
          metadata: { page: i + 1, file: fileName }
        });

      if (error) throw error;
    }

    console.info(`✅ Thành công: ${fileName} (Phòng ban: ${category})`);
  } catch (e: any) {
    console.error(`❌ Lỗi xử lý ${filePath}: ${e.message}`);
  }
}

async function main() {
  if (!fs.existsSync(docDir)) {
    fs.mkdirSync(docDir, { recursive: true });
    console.info(`Đã tạo thư mục ${docDir}. Hãy bỏ file PDF vào đây.`);
    return;
  }

  const files = fs.readdirSync(docDir);
  const pdfFiles = files.filter(file => file.endsWith('.pdf'));

  if (pdfFiles.length === 0) {
    console.info('Không tìm thấy file PDF nào trong thư mục documents.');
    return;
  }

  console.info(`📚 Tìm thấy ${pdfFiles.length} file PDF để xử lý...\n`);

  for (const file of pdfFiles) {
    await ingestPdf(path.join(docDir, file));
  }

  console.info('\n🎉 Hoàn tất xử lý tất cả file PDF!');
}

main().catch(console.error);