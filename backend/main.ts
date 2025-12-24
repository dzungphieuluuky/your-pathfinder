import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { DocumentManager } from './services/doc_manager';

config();

const docDir = process.env.WATCHED_DIR || './documents';

async function main() {
  if (!fs.existsSync(docDir)) {
    fs.mkdirSync(docDir, { recursive: true });
    console.log(`Đã tạo thư mục ${docDir}. Hãy bỏ file PDF vào đây.`);
    return;
  }

  const docManager = new DocumentManager();

  for (const file of fs.readdirSync(docDir)) {
    if (file.endsWith('.pdf')) {
      try {
        await docManager.uploadAndIndex(path.join(docDir, file), "General");
        console.log(`✅ Thành công: ${file}`);
      } catch (e) {
        console.error(`❌ Lỗi xử lý ${file}: ${(e as Error).message}`);
      }
    }
  }
}

main();