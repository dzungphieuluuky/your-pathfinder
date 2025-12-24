import fs from 'fs';
import path from 'path';

import { generateEmbedding } from '../lib/embeddings';
import { supabase } from '../lib/supabase';
import dotenv from 'dotenv';
const pdfParse = require('pdf-parse');
dotenv.config();

const docDir = process.env.WATCHED_DIR || './documents';

async function ingestPdf(filePath: string) {
  const fileName = path.basename(filePath);
  console.info(`--- Đang xử lý: ${fileName} ---`);

  let category = 'General';
  if (fileName.toUpperCase().includes('HR')) category = 'HR';
  else if (fileName.toUpperCase().includes('IT')) category = 'IT';
  else if (fileName.toUpperCase().includes('SALES')) category = 'Sales';

  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    // pdf-parse returns all text, but not per page. For per-page, use another lib or split manually.
    // Here, we treat the whole document as one page for simplicity.
    const text = pdfData.text;
    if (!text || !text.trim()) return;

    const embedding = await generateEmbedding(text);

    const { error } = await supabase
      .from('knowledge_embeddings')
      .insert([{
        content: text,
        embedding,
        category,
        metadata: { page: 1, file: fileName }
      }]);

    if (error) throw error;

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
  for (const file of files) {
    if (file.endsWith('.pdf')) {
      await ingestPdf(path.join(docDir, file));
    }
  }
}

main();