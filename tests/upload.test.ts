import { test, expect, Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function for quick login
const login = async (page: Page, role: 'Admin' | 'User') => {
  await page.goto('http://localhost:3000/#/login');
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
    await page.getByRole('button', { name: 'Document Library' }).click();

    // 2. Open upload modal
    await page.getByRole('button', { name: /Ingest|Upload|Add Document/i }).click();

    // 3. Upload file
    const filePath = path.join(__dirname, 'fixtures', 'deeplearning.md');
    await page.locator('input[type="file"]').setInputFiles(filePath);

    // 4. Verify loading state appears
    await expect(page.getByText(/Processing|Ingesting|Uploading/i).first()).toBeVisible();

    // 5. Verify success message (increased timeout for AI processing)
    await expect(page.getByText(/Ingested|Success|Uploaded/i).first()).toBeVisible({ timeout: 30000 });

    // Verify file name appears in document list
    await expect(page.getByText('deeplearning.md').first()).toBeVisible();

    // Cleanup: Delete file after test
    const deleteButton = page.locator('button:has(svg.lucide-trash2)').first();
    await deleteButton.click();
    page.on('dialog', dialog => dialog.accept());
  });

  // TC02: Verify permissions (Regular user cannot upload)
  // Purpose: Ensure regular users do not see the upload button
  test('TC02: Regular end-user does not see upload button', async ({ page }) => {
    // 1. Login as regular user
    await login(page, 'User');
    await page.getByRole('button', { name: 'Document Library' }).click();

    // 2. Verify "Ingest Document" button does not exist
    await expect(page.getByRole('button', { name: /Ingest|Upload|Add Document/i })).toBeHidden();

    // 3. Verify "READ-ONLY" badge is displayed
    await expect(page.getByText(/READ-ONLY|Read Only|View Only/i)).toBeVisible();
  });

  test('TC03: Upload file with newly created custom category', async ({ page }) => {
    await login(page, 'Admin');
    await page.getByRole('button', { name: 'Document Library' }).click();
    await page.getByRole('button', { name: /Ingest|Upload|Add Document/i }).click();

    // 1. Open category dropdown
    const categoryButton = page.locator('button').filter({ hasText: /General|HR|IT|Sales/ }).first();
    await categoryButton.waitFor({ state: 'visible', timeout: 5000 });
    await categoryButton.click();

    // 2. Select "Create New Category"
    const createNewButton = page.locator('button').filter({ hasText: /Create New Category/ }).first();
    await createNewButton.waitFor({ state: 'visible', timeout: 5000 });
    await createNewButton.click();

    // 3. Enter new category name
    const newCategory = 'ML-Research_' + Date.now();
    const input = page.locator('input[placeholder="Category name..."]').first();
    await input.waitFor({ state: 'visible', timeout: 5000 });
    await input.fill(newCategory);
    
    // Click Create button in the category creation UI
    const createButton = page.locator('button').filter({ hasText: /✓ Create/ }).first();
    await createButton.click();

    // 4. Wait for category to be created
    await page.waitForTimeout(1000);
    
    // Verify the new category is now selected in the dropdown button
    await expect(categoryButton).toContainText(newCategory, { timeout: 5000 });

    // 5. Upload file with new category
    const filePath = path.join(__dirname, 'fixtures', 'ouro_1.4b_thinking.json');
    await page.waitForTimeout(500);
    await page.locator('input[type="file"]').setInputFiles(filePath);
    await expect(page.getByText(/Ingested|Success|Uploaded/i).first()).toBeVisible({ timeout: 30000 });
    
    // 6. Wait for modal to auto-close
    await page.waitForTimeout(2000);
    const closeButton = page.getByRole('button', { name: /Close|Done/i }).first();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    }
    
    // 7. Verify new category appears in document list and file exists
    await expect(page.getByText('ouro_1.4b_thinking.json').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button').filter({ hasText: newCategory }).first()).toBeVisible({ timeout: 5000 });
    
    // 8. Cleanup - Delete document
    const docRow = page.locator('div').filter({ hasText: 'ouro_1.4b_thinking.json' }).first();
    await docRow.hover();
    const deleteButton = page.locator('button[title="Delete document"]').first();
    await deleteButton.waitFor({ state: 'visible', timeout: 5000 });
    await deleteButton.click();
    
    // Accept delete dialog
    page.once('dialog', dialog => dialog.accept());
    await page.waitForTimeout(1000);
  });
  
  test('TC04: Upload multiple files simultaneously (Batch Upload)', async ({ page }) => {
    await login(page, 'Admin');
    await page.getByRole('button', { name: 'Document Library' }).click();
    await page.getByRole('button', { name: /Ingest|Upload|Add Document/i }).click();

    // 1. Prepare multiple files
    const file1 = path.join(__dirname, 'fixtures', 'deeplearning.md');
    const file2 = path.join(__dirname, 'fixtures', 'ouro_1.4b_thinking.json');

    // 2. Upload both files
    await page.waitForTimeout(500);
    await page.locator('input[type="file"]').setInputFiles([file1, file2]);

    // 3. Verify processing and success (wait longer for multiple files)
    await expect(page.getByText(/Ingested|Success|Uploaded/i).first()).toBeVisible({ timeout: 90000 });

    // Wait for modal to auto-close
    await page.waitForTimeout(3000);
    const closeButton = page.getByRole('button', { name: /Close|Done/i }).first();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    }

    // 4. Verify both files appear in list
    await expect(page.getByText('deeplearning.md').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('ouro_1.4b_thinking.json').first()).toBeVisible({ timeout: 5000 });

    page.once('dialog', dialog => dialog.accept());
    await page.waitForTimeout(1000);
  });

  // TC05: Close upload modal and reopen (State Reset)
  // Purpose: Verify UX when closing modal and ensure state management works correctly
  test('TC05: Close upload modal and reopen (State Reset)', async ({ page }) => {
    await login(page, 'Admin');
    await page.getByRole('button', { name: 'Document Library' }).click();

    // 1. Open modal
    await page.getByRole('button', { name: /Ingest|Upload|Add Document/i }).click();
    await expect(page.getByText(/SELECT|Choose|Upload|Assets/i)).toBeVisible();

    // 2. Change category without uploading
    const categoryButton = page.getByRole('button').filter({ hasText: /General|Category|Select/ }).first();
    await categoryButton.click();
    const hrButton = page.locator('button').filter({ hasText: /HR|Finance|Sales/ }).first();
    await hrButton.click();

    // 3. Close modal
    const closeButton = page.getByRole('button', { name: /Close|Done|Cancel/i }).first();
    await closeButton.click();

    // 4. Verify modal is hidden
    await expect(page.getByText(/SELECT|Choose|Upload|Assets/i)).toBeHidden();

    // 5. Reopen modal
    await page.getByRole('button', { name: /Ingest|Upload|Add Document/i }).click();
    await expect(page.getByText(/SELECT|Choose|Upload|Assets/i)).toBeVisible();
    
    // 6. Close modal after test
    await closeButton.click();
  });

  test('TC06: Upload various file types (PDF, JSON, DOCX)', async ({ page }) => {
    await login(page, 'Admin');
    await page.getByRole('button', { name: 'Document Library' }).click();

    const supportedFiles = [
      { path: path.join(__dirname, 'fixtures', 'deeplearning.md'), name: 'deeplearning.md' },
      { path: path.join(__dirname, 'fixtures', 'ouro_1.4b_thinking.json'), name: 'ouro_1.4b_thinking.json' },
      { path: path.join(__dirname, 'fixtures', 'Review.docx'), name: 'Review.docx' }
    ];

    for (const file of supportedFiles) {
      // Open modal
      const ingestButton = page.getByRole('button', { name: /Ingest|Upload|Add Document/i });
      await ingestButton.waitFor({ state: 'visible', timeout: 5000 });
      await ingestButton.click();

      // Wait for modal to render
      await page.waitForTimeout(500);

      // File input is hidden, so use setInputFiles directly
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(file.path);

      // Wait for success
      await expect(page.getByText(/Ingested|Success|Uploaded/i).first()).toBeVisible({ timeout: 30000 });

      // Wait for modal to auto-close
      await page.waitForTimeout(2000);
      const closeButton = page.getByRole('button', { name: /Close|Done/i }).first();
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
      }

      // Verify file in list
      await expect(page.getByText(file.name).first()).toBeVisible({ timeout: 5000 });
    }

    // Cleanup: Delete all uploaded files
    for (const file of supportedFiles) {
      const docRow = page.locator('div').filter({ hasText: file.name }).first();
      if (await docRow.isVisible().catch(() => false)) {
        await docRow.hover();
        const deleteBtn = page.locator('button[title="Delete document"]').first();
        await deleteBtn.waitFor({ state: 'visible', timeout: 5000 });
        await deleteBtn.click();
        page.once('dialog', dialog => dialog.accept());
        await page.waitForTimeout(1000);
      }
    }
  });

  test('TC07: Delete document from library', async ({ page }) => {
    await login(page, 'Admin');
    await page.getByRole('button', { name: 'Document Library' }).click();

    // 1. Upload a test file
    const ingestButton = page.getByRole('button', { name: /Ingest|Upload|Add Document/i });
    await ingestButton.waitFor({ state: 'visible', timeout: 5000 });
    await ingestButton.click();
    
    const filePath = path.join(__dirname, 'fixtures', 'deeplearning.md');
    
    // Wait for modal to render
    await page.waitForTimeout(500);
    
    // File input is hidden, so use setInputFiles directly
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    await expect(page.getByText(/Ingested|Success|Uploaded/i).first()).toBeVisible({ timeout: 30000 });
    
    // Wait for modal to auto-close
    await page.waitForTimeout(2000);
    const closeButton = page.getByRole('button', { name: /Close|Done/i }).first();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    }

    // 2. Verify file appears
    await expect(page.getByText('deeplearning.md').first()).toBeVisible({ timeout: 5000 });

    // 3. Hover over document row to reveal delete button
    const docRow = page.locator('div').filter({ hasText: 'deeplearning.md' }).first();
    await docRow.hover();

    // 4. Click delete button
    const deleteButton = page.locator('button[title="Delete document"]').first();
    await deleteButton.waitFor({ state: 'visible', timeout: 5000 });
    await deleteButton.click();

    // 5. Verify modal appears and click "Remove Permanently" button
    const removeButton = page.locator('button').filter({ hasText: /Remove Permanently/ }).first();
    await removeButton.waitFor({ state: 'visible', timeout: 5000 });
    await removeButton.click();

    // 6. Verify file is removed from list
    await page.waitForTimeout(2000);
    await expect(page.getByText('deeplearning.md')).not.toBeVisible({ timeout: 5000 });
  });

  test('TC08: Filter documents by category', async ({ page }) => {
    await login(page, 'Admin');
    await page.getByRole('button', { name: 'Document Library' }).click();

    // 1. Create custom category and upload file
    const ingestButton = page.getByRole('button', { name: /Ingest|Upload|Add Document/i });
    await ingestButton.waitFor({ state: 'visible', timeout: 5000 });
    await ingestButton.click();
    
    const customCategory = 'Marketing_' + Date.now();
    
    // Open category dropdown
    const categoryButton = page.locator('button').filter({ hasText: /General|HR|IT|Sales/ }).first();
    await categoryButton.waitFor({ state: 'visible', timeout: 5000 });
    await categoryButton.click();
    
    // Create new category
    const createNewButton = page.locator('button').filter({ hasText: /Create New Category/ }).first();
    await createNewButton.waitFor({ state: 'visible', timeout: 5000 });
    await createNewButton.click();
    
    const input = page.locator('input[placeholder="Category name..."]').first();
    await input.waitFor({ state: 'visible', timeout: 5000 });
    await input.fill(customCategory);
    
    const createButton = page.locator('button').filter({ hasText: /✓ Create/ }).first();
    await createButton.click();

    // 2. Upload file with custom category
    await page.waitForTimeout(500);
    const fileInput = page.locator('input[type="file"]');
    const filePath = path.join(__dirname, 'fixtures', 'ouro_1.4b_thinking.json');
    await fileInput.setInputFiles(filePath);
    
    await expect(page.getByText(/Ingested|Success|Uploaded/i).first()).toBeVisible({ timeout: 30000 });
    
    // Wait for modal to auto-close
    await page.waitForTimeout(2000);
    const closeButton = page.getByRole('button', { name: /Close|Done/i }).first();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    }

    // 3. Verify file shows in list
    await expect(page.getByText('ouro_1.4b_thinking.json').first()).toBeVisible({ timeout: 5000 });

    // 4. Click on category filter button
    const categoryFilterButton = page.locator('button[title="Filter by category"]').first();
    await categoryFilterButton.waitFor({ state: 'visible', timeout: 5000 });
    await categoryFilterButton.click();

    // 5. Select custom category from filter dropdown
    const categoryOption = page.locator('button').filter({ hasText: customCategory }).first();
    await categoryOption.waitFor({ state: 'visible', timeout: 5000 });
    await categoryOption.click();

    // 6. Verify documents from that category are shown
    await expect(page.getByText('ouro_1.4b_thinking.json').first()).toBeVisible({ timeout: 5000 });

    // 7. Hover over document row and delete
    const docRow = page.locator('div').filter({ hasText: 'ouro_1.4b_thinking.json' }).first();
    await docRow.hover();

    const deleteButton = page.locator('button[title="Delete document"]').first();
    await deleteButton.waitFor({ state: 'visible', timeout: 5000 });
    await deleteButton.click();

    // 8. Verify modal appears and click "Remove Permanently"
    const removeButton = page.locator('button').filter({ hasText: /Remove Permanently/ }).first();
    await removeButton.waitFor({ state: 'visible', timeout: 5000 });
    await removeButton.click();
    
    await page.waitForTimeout(1000);
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
    * deeplearning.md
    * ouro_1.4b_thinking.json
    * Review.docx (optional)
  
  Installation:
  npm install -D @playwright/test
  
  Create fixture files (if not exist):
  - Create tests/fixtures/ folder
  - Add deeplearning.md, ouro_1.4b_thinking.json, Review.docx files
  
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