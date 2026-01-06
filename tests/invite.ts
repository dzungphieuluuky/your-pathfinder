import { test, expect, Page } from '@playwright/test';
import path from 'path';

// Helper function for login
const login = async (page: Page, role: 'Admin' | 'User') => {
  await page.goto('http://localhost:3000/login');
  await page.getByPlaceholder('name@company.com').fill(`${role.toLowerCase()}@test.com`);
  await page.getByRole('button', { name: role }).click();
  await page.getByRole('button', { name: 'Enter PathFinder' }).click();
  await expect(page).toHaveURL('http://localhost:3000/#/');
};

// Helper to open invite modal
const openInviteModal = async (page: Page) => {
  await page.getByRole('link', { name: 'Team & Settings' }).click();
  await page.getByRole('button', { name: 'Admin Panel' }).click();
  await page.getByRole('button', { name: 'Invite Member' }).click();
  await expect(page.getByText('Invite Teammate')).toBeVisible();
};

test.describe('InviteMemberModal - handleInvite Function Tests', () => {

  // TC01: Successful invitation with default USER role
  test('TC01: Gửi lời mời thành công với role USER mặc định', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    // Generate unique email
    const email = `user_${Date.now()}@test.com`;
    
    // Fill email (role USER is selected by default)
    await page.getByPlaceholder('teammate@company.com').fill(email);
    
    // Verify USER role is selected (check for active border class)
    const userRoleButton = page.locator('button').filter({ hasText: 'Member' }).first();
    await expect(userRoleButton).toHaveClass(/border-indigo-600/);
    
    // Submit form
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    
    // Verify loading state
    await expect(page.getByText('Dispatching via Google Mail...')).toBeVisible();
    
    // Verify success state
    await expect(page.getByText('Invite Dispatched!')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(email)).toBeVisible();
    
    // Verify auto-close (modal should disappear after 2s)
    await expect(page.getByText('Invite Dispatched!')).toBeHidden({ timeout: 3000 });
  });

  // TC02: Successful invitation with ADMIN role
  test('TC02: Gửi lời mời thành công với role ADMIN', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const email = `admin_${Date.now()}@test.com`;
    
    // Fill email
    await page.getByPlaceholder('teammate@company.com').fill(email);
    
    // Select ADMIN role
    const adminRoleButton = page.locator('button').filter({ hasText: 'Administrator' }).first();
    await adminRoleButton.click();
    
    // Verify ADMIN role is active
    await expect(adminRoleButton).toHaveClass(/border-indigo-600/);
    
    // Submit
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    
    // Verify success
    await expect(page.getByText('Invite Dispatched!')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(email)).toBeVisible();
    
    // Wait for modal to close automatically
    await page.waitForTimeout(2500);
    
    // Verify invitation appears in the list with correct role
    const row = page.getByRole('row', { name: email });
    await expect(row).toBeVisible();
    await expect(row).toContainText('Administrator');
  });

  // TC03: Form validation - empty email
  test('TC03: Không cho phép gửi khi email trống', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    // Try to submit without email
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    
    // HTML5 validation should prevent submission
    // Check if we're still on the form (not success state)
    await expect(page.getByText('Target Email')).toBeVisible();
    await expect(page.getByText('Invite Dispatched!')).not.toBeVisible();
  });

  // TC04: Error handling - duplicate email (if implemented)
  test('TC04: Xử lý lỗi khi email đã tồn tại trong hệ thống', async ({ page }) => {
    await login(page, 'Admin');
    
    // First invitation
    const duplicateEmail = `duplicate_${Date.now()}@test.com`;
    await openInviteModal(page);
    await page.getByPlaceholder('teammate@company.com').fill(duplicateEmail);
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    
    // Wait for success and modal close
    await expect(page.getByText('Invite Dispatched!')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2500);
    
    // Try to send duplicate invitation
    await page.getByRole('button', { name: 'Invite Member' }).click();
    await page.getByPlaceholder('teammate@company.com').fill(duplicateEmail);
    
    // Listen for dialog (alert)
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('Invitation Error');
      dialog.accept();
    });
    
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    
    // Should stay on form after error
    await page.waitForTimeout(2000);
    await expect(page.getByText('Target Email')).toBeVisible();
  });

  // TC05: Disabled state during submission
  test('TC05: Nút submit bị vô hiệu hóa trong khi xử lý', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const email = `loading_${Date.now()}@test.com`;
    await page.getByPlaceholder('teammate@company.com').fill(email);
    
    // Click submit
    const submitButton = page.getByRole('button', { name: 'Send Invitation' });
    await submitButton.click();
    
    // Verify button is disabled during processing
    await expect(submitButton).toBeDisabled();
    await expect(page.getByText('Dispatching via Google Mail...')).toBeVisible();
    
    // Button should have disabled styling
    await expect(submitButton).toHaveClass(/opacity-50/);
    
    // Wait for completion
    await expect(page.getByText('Invite Dispatched!')).toBeVisible({ timeout: 5000 });
  });

  // TC06: Close modal using X button
  test('TC06: Đóng modal bằng nút X', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    // Verify modal is open
    await expect(page.getByText('Invite Teammate')).toBeVisible();
    
    // Click X button
    const closeButton = page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first();
    await closeButton.click();
    
    // Verify modal is closed
    await expect(page.getByText('Invite Teammate')).toBeHidden();
    await expect(page.getByText('Target Email')).toBeHidden();
  });

  // TC07: Email format validation
  test('TC07: Kiểm tra validation định dạng email', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    // Type invalid email
    const emailInput = page.getByPlaceholder('teammate@company.com');
    await emailInput.fill('invalid-email-format');
    
    // Try to submit
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    
    // HTML5 validation should prevent submission
    // Check validation state
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
    
    // Should still be on form
    await expect(page.getByText('Target Email')).toBeVisible();
  });

  // TC08: Role toggle functionality
  test('TC08: Chuyển đổi giữa role USER và ADMIN', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const userRoleButton = page.locator('button').filter({ hasText: 'Member' }).first();
    const adminRoleButton = page.locator('button').filter({ hasText: 'Administrator' }).first();
    
    // Initially USER should be selected
    await expect(userRoleButton).toHaveClass(/border-indigo-600/);
    await expect(adminRoleButton).not.toHaveClass(/border-indigo-600/);
    
    // Click ADMIN
    await adminRoleButton.click();
    await expect(adminRoleButton).toHaveClass(/border-indigo-600/);
    await expect(userRoleButton).not.toHaveClass(/border-indigo-600/);
    
    // Click USER again
    await userRoleButton.click();
    await expect(userRoleButton).toHaveClass(/border-indigo-600/);
    await expect(adminRoleButton).not.toHaveClass(/border-indigo-600/);
  });

  // TC09: Success state displays correct email with bold styling
  test('TC09: Màn hình thành công hiển thị đúng email với format bold', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const testEmail = `success_${Date.now()}@company.com`;
    
    await page.getByPlaceholder('teammate@company.com').fill(testEmail);
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    
    // Wait for success state
    await expect(page.getByText('Invite Dispatched!')).toBeVisible({ timeout: 5000 });
    
    // Verify email appears with bold styling
    const emailElement = page.locator('span', { hasText: testEmail }).first();
    await expect(emailElement).toBeVisible();
    await expect(emailElement).toHaveClass(/font-bold/);
  });

  // TC10: Multiple rapid submissions prevention
  test('TC10: Ngăn chặn việc gửi nhiều lần liên tiếp', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const email = `rapid_${Date.now()}@test.com`;
    await page.getByPlaceholder('teammate@company.com').fill(email);
    
    const submitButton = page.getByRole('button', { name: 'Send Invitation' });
    
    // Try to click multiple times rapidly
    await submitButton.click();
    await submitButton.click({ force: true });
    await submitButton.click({ force: true });
    
    // Button should be disabled after first click
    await expect(submitButton).toBeDisabled();
    
    // Wait for completion
    await expect(page.getByText('Invite Dispatched!')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2500);
    
    // Check that only one invitation was created
    const rows = page.getByRole('row', { name: email });
    await expect(rows).toHaveCount(1);
  });

  // TC11: Invitation appears in pending list after success
  test('TC11: Lời mời xuất hiện trong danh sách Pending sau khi gửi', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const email = `pending_${Date.now()}@test.com`;
    
    await page.getByPlaceholder('teammate@company.com').fill(email);
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    
    // Wait for success and auto-close
    await expect(page.getByText('Invite Dispatched!')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2500);
    
    // Verify invitation in list
    const row = page.getByRole('row', { name: email });
    await expect(row).toBeVisible();
    await expect(row).toContainText('Pending');
    
    // Verify security role badge
    await expect(row).toContainText('Member'); // Default role
  });

  // TC12: Form state persistence after error
  test('TC12: Trạng thái form được giữ nguyên sau khi có lỗi', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const testEmail = 'test@example.com';
    
    // Fill form and select ADMIN role
    await page.getByPlaceholder('teammate@company.com').fill(testEmail);
    const adminRoleButton = page.locator('button').filter({ hasText: 'Administrator' }).first();
    await adminRoleButton.click();
    
    // Mock an error by intercepting the Supabase request
    await page.route('**/rest/v1/invitations*', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ message: 'Server error' })
      });
    });
    
    // Handle alert
    page.on('dialog', dialog => dialog.accept());
    
    // Submit
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    
    // Wait for error handling
    await page.waitForTimeout(2000);
    
    // Verify form still shows with previously entered data
    await expect(page.getByPlaceholder('teammate@company.com')).toHaveValue(testEmail);
    await expect(adminRoleButton).toHaveClass(/border-indigo-600/);
  });

  // TC13: Success animation and notification
  test('TC13: Kiểm tra animation và notification khi thành công', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const email = `animation_${Date.now()}@test.com`;
    
    await page.getByPlaceholder('teammate@company.com').fill(email);
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    
    // Verify loading state with spinner
    const loadingText = page.getByText('Dispatching via Google Mail...');
    await expect(loadingText).toBeVisible();
    
    // Verify success state appears
    await expect(page.getByText('Invite Dispatched!')).toBeVisible({ timeout: 5000 });
    
    // Verify success icon
    const successIcon = page.locator('svg.lucide-check-circle').first();
    await expect(successIcon).toBeVisible();
    
    // Verify notification message
    await expect(page.getByText('A secure activation link has been sent to')).toBeVisible();
    await expect(page.getByText('Notification sent to your admin panel')).toBeVisible();
  });

});

// # Install Playwright if not already installed
// npm install -D @playwright/test

// # Run the tests
// npx playwright test InviteMemberModal.spec.ts

// # Run with UI mode
// npx playwright test InviteMemberModal.spec.ts --ui

// # Run specific test
// npx playwright test InviteMemberModal.spec.ts -g "TC01"