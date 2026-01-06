import { test, expect, Page } from '@playwright/test';
import path from 'path';

// Helper function for quick login
const login = async (page: Page, role: 'Admin' | 'User') => {
  await page.goto('http://localhost:3000/login');
  await page.getByPlaceholder('name@company.com').fill(`${role.toLowerCase()}@test.com`);
  await page.getByRole('button', { name: role }).click();
  await page.getByRole('button', { name: 'Enter PathFinder' }).click();
  await expect(page).toHaveURL('http://localhost:3000/#/');
};

test.describe('Document Upload Functionality', () => {

  // TC01: Successfully upload a single PDF file (Happy Path)
  // Purpose: Verify standard workflow from file selection to appearance in document list
  test('TC01: Admin successfully uploads a single PDF file', async ({ page }) => {
    // 1. Login as Admin and navigate to Document Library
    await login(page, 'Admin');
    await page.getByRole('link', { name: 'Document Library' }).click();

    // 2. Open upload modal
    await page.getByRole('button', { name: 'Ingest Document' }).click();

    // 3. Upload file
    const filePath = path.join(__dirname, 'fixtures', 'sample.pdf');
    await page.locator('input[type="file"]').setInputFiles(filePath);

    // 4. Verify loading state appears
    // UI shows "Processing Assets..." while processing
    await expect(page.getByText('Processing Assets...')).toBeVisible();

    // 5. Verify success message (increased timeout for AI processing)
    await expect(page.getByText('Document Ingested Successfully')).toBeVisible({ timeout: 30000 });

    // 6. Close modal and verify file appears in list
    await page.getByRole('button', { name: 'Close' }).click();
    
    // Verify file name appears in document list
    await expect(page.getByText('sample.pdf').first()).toBeVisible();

    // Cleanup: Delete file after test
    const deleteButton = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).first();
    await deleteButton.click();
    page.on('dialog', dialog => dialog.accept());
  });

  // TC02: Verify permissions (Regular user cannot upload)
  // Purpose: Ensure regular users do not see the upload button
  test('TC02: Regular end-user does not see upload button', async ({ page }) => {
    // 1. Login as regular user
    await login(page, 'User');
    await page.getByRole('link', { name: 'Document Library' }).click();

    // 2. Verify "Ingest Document" button does not exist
    await expect(page.getByRole('button', { name: 'Ingest Document' })).toBeHidden();

    // 3. Verify "READ-ONLY VAULT" badge is displayed
    await expect(page.getByText('READ-ONLY VAULT')).toBeVisible();
  });

  // TC03: Upload file with custom category creation
  // Purpose: Verify dropdown logic and custom category creation flow
  test('TC03: Upload file with newly created custom category', async ({ page }) => {
    await login(page, 'Admin');
    await page.getByRole('link', { name: 'Document Library' }).click();
    await page.getByRole('button', { name: 'Ingest Document' }).click();

    // 1. Open category dropdown (default is "General")
    await page.getByRole('button', { name: 'General' }).click();

    // 2. Select "Create New Category"
    await page.getByRole('button', { name: 'Create New Category' }).click();

    // 3. Enter new category name
    const newCategory = 'Legal_Docs_' + Date.now();
    await page.getByPlaceholder('Category name...').fill(newCategory);
    await page.getByRole('button', { name: 'Create' }).click();

    // 4. Verify dropdown now shows new category
    await expect(page.getByRole('button', { name: newCategory })).toBeVisible();

    // 5. Upload file with new category
    const filePath = path.join(__dirname, 'fixtures', 'data.json');
    await page.locator('input[type="file"]').setInputFiles(filePath);
    await expect(page.getByText('Document Ingested Successfully')).toBeVisible({ timeout: 30000 });
    
    // 6. Verify file appears in list with correct category
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByText(newCategory)).toBeVisible();
    
    // Cleanup
    const deleteButton = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).first();
    await deleteButton.click();
    page.on('dialog', dialog => dialog.accept());
  });

  // TC04: Upload multiple files simultaneously (Batch Upload)
  // Purpose: Verify batch file processing in sequential order
  test('TC04: Upload multiple files simultaneously (Batch Upload)', async ({ page }) => {
    await login(page, 'Admin');
    await page.getByRole('link', { name: 'Document Library' }).click();
    await page.getByRole('button', { name: 'Ingest Document' }).click();

    // 1. Prepare multiple files
    const file1 = path.join(__dirname, 'fixtures', 'sample.pdf');
    const file2 = path.join(__dirname, 'fixtures', 'data.json');

    // 2. Upload both files
    await page.locator('input[type="file"]').setInputFiles([file1, file2]);

    // 3. Verify processing and success
    // System processes files sequentially, wait for final success message
    await expect(page.getByText('Document Ingested Successfully')).toBeVisible({ timeout: 60000 });

    await page.getByRole('button', { name: 'Close' }).click();

    // 4. Verify both files appear in list
    await expect(page.getByText('sample.pdf').first()).toBeVisible();
    await expect(page.getByText('data.json').first()).toBeVisible();

    // Cleanup: Delete both files
    const deleteButtons = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') });
    const count = await deleteButtons.count();
    for (let i = 0; i < count; i++) {
      await page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).first().click();
      page.on('dialog', dialog => dialog.accept());
      await page.waitForTimeout(1000);
    }
  });

  // TC05: Close upload modal and reopen (State Reset)
  // Purpose: Verify UX when closing modal and ensure state management works correctly
  test('TC05: Close upload modal and reopen (State Reset)', async ({ page }) => {
    await login(page, 'Admin');
    await page.getByRole('link', { name: 'Document Library' }).click();

    // 1. Open modal
    await page.getByRole('button', { name: 'Ingest Document' }).click();
    await expect(page.getByText('SELECT VAULT ASSETS')).toBeVisible();

    // 2. Change category without uploading
    const categoryButton = page.getByRole('button', { name: 'General' });
    await categoryButton.click();
    await page.getByRole('button', { name: 'HR' }).click();
    await expect(page.getByRole('button', { name: 'HR' })).toBeVisible();

    // 3. Close modal (X icon or Close button)
    const closeButton = page.getByRole('button', { name: 'Close' }).first();
    await closeButton.click();

    // 4. Verify modal is hidden
    await expect(page.getByText('SELECT VAULT ASSETS')).toBeHidden();

    // 5. Reopen modal and verify state
    // Note: Category state may persist depending on component lifecycle
    await page.getByRole('button', { name: 'Ingest Document' }).click();
    await expect(page.getByText('SELECT VAULT ASSETS')).toBeVisible();
    
    // Verify selected category (HR persists based on component state design)
    await expect(page.getByRole('button', { name: 'HR' })).toBeVisible();

    // 6. Close modal after test
    await page.getByRole('button', { name: 'Close' }).click();
  });

  // TC06: Upload file with different file types
  // Purpose: Verify system supports multiple document formats
  test('TC06: Upload various file types (PDF, JSON, DOCX)', async ({ page }) => {
    await login(page, 'Admin');
    await page.getByRole('link', { name: 'Document Library' }).click();

    const supportedFiles = [
      { path: path.join(__dirname, 'fixtures', 'sample.pdf'), name: 'sample.pdf' },
      { path: path.join(__dirname, 'fixtures', 'data.json'), name: 'data.json' },
      { path: path.join(__dirname, 'fixtures', 'document.docx'), name: 'document.docx' }
    ];

    for (const file of supportedFiles) {
      // Open modal
      await page.getByRole('button', { name: 'Ingest Document' }).click();

      // Upload file
      await page.locator('input[type="file"]').setInputFiles(file.path);

      // Wait for success
      await expect(page.getByText('Document Ingested Successfully')).toBeVisible({ timeout: 30000 });

      // Close modal
      await page.getByRole('button', { name: 'Close' }).click();

      // Verify file in list
      await expect(page.getByText(file.name).first()).toBeVisible();
    }

    // Cleanup: Delete all uploaded files
    const deleteButtons = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') });
    const count = await deleteButtons.count();
    for (let i = 0; i < count; i++) {
      await page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).first().click();
      page.on('dialog', dialog => dialog.accept());
      await page.waitForTimeout(500);
    }
  });

  // TC07: Delete document from library
  // Purpose: Verify document deletion functionality and confirmation flow
  test('TC07: Delete document from library', async ({ page }) => {
    await login(page, 'Admin');
    await page.getByRole('link', { name: 'Document Library' }).click();

    // 1. Upload a test file
    await page.getByRole('button', { name: 'Ingest Document' }).click();
    const filePath = path.join(__dirname, 'fixtures', 'sample.pdf');
    await page.locator('input[type="file"]').setInputFiles(filePath);
    await expect(page.getByText('Document Ingested Successfully')).toBeVisible({ timeout: 30000 });
    await page.getByRole('button', { name: 'Close' }).click();

    // 2. Verify file appears
    await expect(page.getByText('sample.pdf').first()).toBeVisible();

    // 3. Click delete button
    const deleteButton = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).first();
    
    // Set up dialog handler
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('delete');
      dialog.accept();
    });

    await deleteButton.click();

    // 4. Verify file is removed from list
    await page.waitForTimeout(2000);
    await expect(page.getByText('sample.pdf')).not.toBeVisible();
  });

  // TC08: Category filter in document library
  // Purpose: Verify filtering documents by category works correctly
  test('TC08: Filter documents by category', async ({ page }) => {
    await login(page, 'Admin');
    await page.getByRole('link', { name: 'Document Library' }).click();

    // 1. Create custom category and upload file
    await page.getByRole('button', { name: 'Ingest Document' }).click();
    const customCategory = 'Marketing_' + Date.now();
    
    await page.getByRole('button', { name: 'General' }).click();
    await page.getByRole('button', { name: 'Create New Category' }).click();
    await page.getByPlaceholder('Category name...').fill(customCategory);
    await page.getByRole('button', { name: 'Create' }).click();

    // 2. Upload file with custom category
    const filePath = path.join(__dirname, 'fixtures', 'data.json');
    await page.locator('input[type="file"]').setInputFiles(filePath);
    await expect(page.getByText('Document Ingested Successfully')).toBeVisible({ timeout: 30000 });
    await page.getByRole('button', { name: 'Close' }).click();

    // 3. Verify file shows with category filter
    const categoryFilter = page.getByRole('button').filter({ hasText: customCategory });
    await expect(categoryFilter).toBeVisible();

    // 4. Click on category to filter
    await categoryFilter.click();

    // Verify only documents from that category are shown
    await expect(page.getByText('data.json').first()).toBeVisible();

    // Cleanup
    const deleteButton = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).first();
    await deleteButton.click();
    page.on('dialog', dialog => dialog.accept());
  });

});

/*
  ============================================================
  HOW TO RUN THESE TESTS
  ============================================================
  
  Prerequisites:
  - Node.js and npm installed
  - Application running on http://localhost:3000
  - Playwright browser installed
  - Test fixture files in tests/fixtures/ folder:
    * sample.pdf
    * data.json
    * document.docx (optional)
  
  Installation:
  npm install -D @playwright/test
  
  Create fixture files (if not exist):
  - Create tests/fixtures/ folder
  - Add sample.pdf, data.json, document.docx files
  
  Run all upload tests:
  npx playwright test tests/upload.ts
  
  Run specific test case:
  npx playwright test tests/upload.ts -g "TC01"
  
  Run with UI mode (visual mode):
  npx playwright test tests/upload.ts --ui
  
  Run with headed mode (see browser):
  npx playwright test tests/upload.ts --headed
  
  Debug mode (step through tests):
  npx playwright test tests/upload.ts --debug
  
  Generate HTML report:
  npx playwright test tests/upload.ts && npx playwright show-report
  
  Run in specific browser:
  npx playwright test tests/upload.ts --project=firefox
  npx playwright test tests/upload.ts --project=webkit
  npx playwright test tests/upload.ts --project=chromium
  
  View test results:
  npx playwright show-report
  
  ============================================================
*/