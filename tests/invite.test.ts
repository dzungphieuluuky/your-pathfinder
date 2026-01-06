import { test, expect, Page } from '@playwright/test';

// Helper function for login
const login = async (page: Page, role: 'Admin' | 'User') => {
  await page.goto('http://localhost:3000/#/login');
  await page.getByPlaceholder('name@company.com').fill(`${role.toLowerCase()}@test.com`);
  await page.getByRole('button', { name: role }).click();
  await page.getByRole('button', { name: 'Enter PathFinder' }).click();
  await expect(page).toHaveURL('http://localhost:3000/#/');
};

// Helper to open invite modal
const openInviteModal = async (page: Page) => {
  await page.getByRole('link', { name: 'Team & Settings' }).click();
  await page.getByRole('button', { name: /Admin|Settings|Panel/i }).click();
  await page.getByRole('button', { name: /Invite|Add Member|Invite Member/i }).click();
  await expect(page.getByText(/Invite|Send Invitation/i)).toBeVisible();
};

test.describe('InviteMemberModal - handleInvite Function Tests', () => {

  // TC01: Successful invitation with default USER role
  test('TC01: Send successful invitation with default USER role', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    // Generate unique email
    const email = `user_${Date.now()}@test.com`;
    
    // Fill email (role USER is selected by default)
    await page.getByPlaceholder(/email|@company/i).fill(email);
    
    // Verify USER role is selected
    const userRoleButton = page.locator('button').filter({ hasText: /User|Member|Role/ }).first();
    await expect(userRoleButton).toHaveClass(/border|active|selected/);
    
    // Submit form
    await page.getByRole('button', { name: /Send|Submit|Invite/i }).click();
    
    // Verify loading state
    await expect(page.getByText(/Dispatching|Processing|Sending/i)).toBeVisible();
    
    // Verify success state
    await expect(page.getByText(/Dispatched|Success|Sent/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(email)).toBeVisible();
    
    // Verify auto-close (modal should disappear)
    await expect(page.getByText(/Dispatched|Success|Sent/i)).toBeHidden({ timeout: 3000 });
  });

  // TC02: Successful invitation with ADMIN role
  test('TC02: Send successful invitation with ADMIN role', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const email = `admin_${Date.now()}@test.com`;
    
    // Fill email
    await page.getByPlaceholder(/email|@company/i).fill(email);
    
    // Select ADMIN role
    const adminRoleButton = page.locator('button').filter({ hasText: /Admin|Administrator/ }).first();
    await adminRoleButton.click();
    
    // Verify ADMIN role is active
    await expect(adminRoleButton).toHaveClass(/border|active|selected/);
    
    // Submit
    await page.getByRole('button', { name: /Send|Submit|Invite/i }).click();
    
    // Verify success
    await expect(page.getByText(/Dispatched|Success|Sent/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(email)).toBeVisible();
    
    // Wait for modal to close automatically
    await page.waitForTimeout(2500);
  });

  // TC03: Form validation - empty email
  test('TC03: Prevent submission with empty email', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    // Try to submit without email
    await page.getByRole('button', { name: /Send|Submit|Invite/i }).click();
    
    // HTML5 validation should prevent submission
    await expect(page.getByText(/Invite|Email|Target/i)).toBeVisible();
    await expect(page.getByText(/Dispatched|Success|Sent/i)).not.toBeVisible();
  });

  // TC04: Error handling - duplicate email
  test('TC04: Handle error when email already exists in system', async ({ page }) => {
    await login(page, 'Admin');
    
    // First invitation
    const duplicateEmail = `duplicate_${Date.now()}@test.com`;
    await openInviteModal(page);
    await page.getByPlaceholder(/email|@company/i).fill(duplicateEmail);
    await page.getByRole('button', { name: /Send|Submit|Invite/i }).click();
    
    // Wait for success and modal close
    await expect(page.getByText(/Dispatched|Success|Sent/i)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2500);
    
    // Try to send duplicate invitation
    await page.getByRole('button', { name: /Invite|Add Member|Invite Member/i }).click();
    await page.getByPlaceholder(/email|@company/i).fill(duplicateEmail);
    
    // Listen for dialog (alert)
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain(/error|Error|already|exists/i);
      dialog.accept();
    });
    
    await page.getByRole('button', { name: /Send|Submit|Invite/i }).click();
    
    // Should stay on form after error
    await page.waitForTimeout(2000);
    await expect(page.getByText(/Invite|Email|Target/i)).toBeVisible();
  });

  // TC05: Disabled state during submission
  test('TC05: Submit button is disabled during processing', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const email = `loading_${Date.now()}@test.com`;
    await page.getByPlaceholder(/email|@company/i).fill(email);
    
    // Click submit
    const submitButton = page.getByRole('button', { name: /Send|Submit|Invite/i });
    await submitButton.click();
    
    // Verify button is disabled during processing
    await expect(submitButton).toBeDisabled();
    await expect(page.getByText(/Dispatching|Processing|Sending/i)).toBeVisible();
    
    // Button should have disabled styling
    await expect(submitButton).toHaveClass(/opacity|disabled|gray/);
    
    // Wait for completion
    await expect(page.getByText(/Dispatched|Success|Sent/i)).toBeVisible({ timeout: 5000 });
  });

  // TC06: Close modal using X button
  test('TC06: Close modal using X button', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    // Verify modal is open
    await expect(page.getByText(/Invite|Send Invitation/i)).toBeVisible();
    
    // Click X button
    const closeButton = page.locator('button').filter({ has: page.locator('svg').filter({ has: page.locator('[data-icon="x"]') }) }).first();
    await closeButton.click();
    
    // Verify modal is closed
    await expect(page.getByText(/Invite|Send Invitation/i)).toBeHidden();
  });

  // TC07: Email format validation
  test('TC07: Validate email format', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    // Type invalid email
    const emailInput = page.getByPlaceholder(/email|@company/i);
    await emailInput.fill('invalid-email-format');
    
    // Try to submit
    await page.getByRole('button', { name: /Send|Submit|Invite/i }).click();
    
    // Check validation state
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
    
    // Should still be on form
    await expect(page.getByText(/Invite|Email|Target/i)).toBeVisible();
  });

  // TC08: Role toggle functionality
  test('TC08: Toggle between USER and ADMIN roles', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const userRoleButton = page.locator('button').filter({ hasText: /User|Member/ }).first();
    const adminRoleButton = page.locator('button').filter({ hasText: /Admin|Administrator/ }).first();
    
    // Initially USER should be selected
    await expect(userRoleButton).toHaveClass(/border|active|selected/);
    
    // Click ADMIN
    await adminRoleButton.click();
    await expect(adminRoleButton).toHaveClass(/border|active|selected/);
    
    // Click USER again
    await userRoleButton.click();
    await expect(userRoleButton).toHaveClass(/border|active|selected/);
  });

  // TC09: Success state displays correct email with bold styling
  test('TC09: Success state displays correct email with bold styling', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const testEmail = `success_${Date.now()}@company.com`;
    
    await page.getByPlaceholder(/email|@company/i).fill(testEmail);
    await page.getByRole('button', { name: /Send|Submit|Invite/i }).click();
    
    // Wait for success state
    await expect(page.getByText(/Dispatched|Success|Sent/i)).toBeVisible({ timeout: 5000 });
    
    // Verify email appears with formatting
    const emailElement = page.locator('span, p, div').filter({ hasText: testEmail }).first();
    await expect(emailElement).toBeVisible();
    await expect(emailElement).toHaveClass(/font-bold|font-semibold|font-black|font-\d+/);
  });

  // TC10: Multiple rapid submissions prevention
  test('TC10: Prevent multiple rapid submissions', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const email = `rapid_${Date.now()}@test.com`;
    await page.getByPlaceholder(/email|@company/i).fill(email);
    
    const submitButton = page.getByRole('button', { name: /Send|Submit|Invite/i });
    
    // Try to click multiple times rapidly
    await submitButton.click();
    await submitButton.click({ force: true });
    await submitButton.click({ force: true });
    
    // Button should be disabled after first click
    await expect(submitButton).toBeDisabled();
    
    // Wait for completion
    await expect(page.getByText(/Dispatched|Success|Sent/i)).toBeVisible({ timeout: 5000 });
  });

  // TC11: Invitation appears in pending list after success
  test('TC11: Invitation appears in pending list after success', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const email = `pending_${Date.now()}@test.com`;
    
    await page.getByPlaceholder(/email|@company/i).fill(email);
    await page.getByRole('button', { name: /Send|Submit|Invite/i }).click();
    
    // Wait for success and auto-close
    await expect(page.getByText(/Dispatched|Success|Sent/i)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2500);
    
    // Verify invitation in list
    const row = page.getByText(email);
    await expect(row).toBeVisible();
    await expect(row).toContainText(/Pending|Waiting|Invited/i);
  });

  // TC12: Form state persistence after error
  test('TC12: Form state persists after error', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const testEmail = 'test@example.com';
    
    // Fill form and select ADMIN role
    await page.getByPlaceholder(/email|@company/i).fill(testEmail);
    const adminRoleButton = page.locator('button').filter({ hasText: /Admin|Administrator/ }).first();
    await adminRoleButton.click();
    
    // Mock an error by intercepting request
    await page.route('**/rest/v1/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ message: 'Server error' })
      });
    });
    
    // Handle alert
    page.on('dialog', dialog => dialog.accept());
    
    // Submit
    await page.getByRole('button', { name: /Send|Submit|Invite/i }).click();
    
    // Wait for error handling
    await page.waitForTimeout(2000);
    
    // Verify form still shows with previously entered data
    const emailInput = page.getByPlaceholder(/email|@company/i);
    const emailValue = await emailInput.inputValue();
    expect(emailValue).toBe(testEmail);
    await expect(adminRoleButton).toHaveClass(/border|active|selected/);
  });

  // TC13: Success animation and notification
  test('TC13: Verify success animation and notification', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const email = `animation_${Date.now()}@test.com`;
    
    await page.getByPlaceholder(/email|@company/i).fill(email);
    await page.getByRole('button', { name: /Send|Submit|Invite/i }).click();
    
    // Verify loading state
    await expect(page.getByText(/Dispatching|Processing|Sending/i)).toBeVisible();
    
    // Verify success state appears
    await expect(page.getByText(/Dispatched|Success|Sent/i)).toBeVisible({ timeout: 5000 });
    
    // Verify success icon
    const successIcon = page.locator('svg').filter({ has: page.locator('[data-icon="check"]') }).first();
    await expect(successIcon).toBeVisible();
    
    // Verify notification message
    await expect(page.getByText(/link|sent|activated/i)).toBeVisible();
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
  
  Installation:
  npm install -D @playwright/test
  
  Run all invite tests:
  npx playwright test tests/invite.ts
  
  Run specific test case:
  npx playwright test tests/invite.ts -g "TC01"
  
  Run with UI mode (visual mode):
  npx playwright test tests/invite.ts --ui
  
  Run with headed mode (see browser):
  npx playwright test tests/invite.ts --headed
  
  Debug mode (step through tests):
  npx playwright test tests/invite.ts --debug
  
  Generate HTML report:
  npx playwright test tests/invite.ts && npx playwright show-report
  
  Run in specific browser:
  npx playwright test tests/invite.ts --project=firefox
  npx playwright test tests/invite.ts --project=webkit
  npx playwright test tests/invite.ts --project=chromium
  
  View test results:
  npx playwright show-report
  
  ============================================================
*/