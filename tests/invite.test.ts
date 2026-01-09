import { test, expect, Page } from '@playwright/test';

// Helper function for login
const login = async (page: Page, role: 'Admin' | 'User') => {
  await page.goto('http://localhost:3000/#/login');
  await page.getByPlaceholder('name@company.com').fill(`${role.toLowerCase()}@test.com`);
  await page.getByRole('button', { name: role }).click();
  await page.getByRole('button', { name: 'Enter PathFinder' }).click();
  await expect(page).toHaveURL(/#\/$/);
};

// Helper to open invite modal
const openInviteModal = async (page: Page) => {
  // Step 1: Click "Team & Settings" button
  await page.getByRole('button', { name: 'Team & Settings' }).click();
  
  // Step 2: Wait for Workspace Settings page to load
  await expect(page.getByRole('heading', { name: 'Workspace Settings' })).toBeVisible({ timeout: 5000 });
  
  // Step 3: Click "Admin Panel" button
  await page.getByRole('button', { name: 'Admin Panel' }).click();
  
  // Step 4: Click "Invite Member" button
  await page.getByRole('button', { name: 'Invite Member' }).click();
  
  // Step 5: Wait for "Invite Teammate" modal to appear
  await expect(page.getByText('Invite Teammate')).toBeVisible({ timeout: 5000 });
};

test.describe('InviteMemberModal - Invitation Email Tests', () => {

  test('TC01: Admin sends successful invitation with USER role', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const email = `user_${Date.now()}@test.com`;
    await page.getByPlaceholder('teammate@company.com').fill(email);
    
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    
    // Verify success message
    await expect(page.getByText('Invite Sent!')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/They'll receive an activation link/)).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });

  test('TC02: Admin sends invitation with ADMIN role to new member', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const email = `admin_${Date.now()}@test.com`;
    
    // Fill email
    await page.getByPlaceholder('teammate@company.com').fill(email);
    
    // Select ADMIN role button - find within the grid-cols-2
    const roleSection = page.locator('div').filter({ hasText: /Security Role/ }).first();
    const adminRoleButton = roleSection.locator('button').filter({ hasText: 'ADMIN' }).first();
    await adminRoleButton.click();
    
    // Verify ADMIN role is selected
    await expect(adminRoleButton).toHaveClass(/border-indigo-600|bg-indigo-50/);
    
    // Submit
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    
    // Verify success state
    await expect(page.getByText('Invite Sent!')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByText('✓ Email delivered successfully')).toBeVisible();
    
    // Wait for modal to close automatically
    await page.waitForTimeout(2500);
  });

  test('TC03: Prevent submission with empty email', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const submitButton = page.getByRole('button', { name: 'Send Invitation' });
    
    // Submit button should be disabled without email
    await expect(submitButton).toBeDisabled();
  });

  test('TC04: Email format validation', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const emailInput = page.getByPlaceholder('teammate@company.com');
    
    // Type invalid email format
    await emailInput.fill('invalid-email');
    
    // Try to submit
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    
    // HTML5 validation should prevent submission, should remain on form
    await expect(page.getByText('Invite Teammate')).toBeVisible();
    await expect(page.getByText('Invite Sent!')).not.toBeVisible();
  });

  test('TC05: Submit button disabled during email sending', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const email = `loading_${Date.now()}@test.com`;
    await page.getByPlaceholder('teammate@company.com').fill(email);
    
    const submitButton = page.getByRole('button', { name: 'Send Invitation' });
    
    // Click submit and immediately check disabled state
    await submitButton.click();
    
    // Button should be disabled during processing
    await expect(submitButton).toBeDisabled();
    await expect(page.getByText(/Sending invitation/i)).toBeVisible();
    
    // Wait for completion
    await expect(page.getByText('Invite Sent!')).toBeVisible({ timeout: 10000 });
  });

  test('TC06: Close modal using X button', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    await expect(page.getByText('Invite Teammate')).toBeVisible();
    
    // Click X button to close (top-right of modal)
    await page.locator('button[title="Close invite modal"]').click();
    
    await expect(page.getByText('Invite Teammate')).not.toBeVisible();
  });

  test('TC07: Toggle between USER and ADMIN roles', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const roleSection = page.locator('div').filter({ hasText: /Security Role/ }).first();
    const userRoleButton = roleSection.locator('button').filter({ hasText: /^USER$/ }).first();
    const adminRoleButton = roleSection.locator('button').filter({ hasText: 'ADMIN' }).first();
    
    // USER should be selected by default
    await expect(userRoleButton).toHaveClass(/border-indigo-600|bg-indigo-50/);
    
    // Click ADMIN
    await adminRoleButton.click();
    await expect(adminRoleButton).toHaveClass(/border-indigo-600|bg-indigo-50/);
    
    // Click USER again
    await userRoleButton.click();
    await expect(userRoleButton).toHaveClass(/border-indigo-600|bg-indigo-50/);
  });

  test('TC08: Success state displays correct email with bold styling', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const testEmail = `success_${Date.now()}@company.com`;
    
    await page.getByPlaceholder('teammate@company.com').fill(testEmail);
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    
    // Wait for success state
    await expect(page.getByText('Invite Sent!')).toBeVisible({ timeout: 10000 });
    
    // Verify email appears with bold styling
    const emailElement = page.locator('span').filter({ hasText: testEmail }).first();
    await expect(emailElement).toBeVisible();
    await expect(emailElement).toHaveClass(/font-bold/);
  });

  test('TC09: Success screen shows check icon', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const email = `checkicon_${Date.now()}@test.com`;
    await page.getByPlaceholder('teammate@company.com').fill(email);
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    
    await expect(page.getByText('Invite Sent!')).toBeVisible({ timeout: 10000 });
    
    // Verify success icon and message
    await expect(page.locator('svg')).toBeVisible();
    await expect(page.getByText(/Email delivered successfully/)).toBeVisible();
  });

  test('TC10: Modal auto-closes after successful invitation', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const email = `autoclose_${Date.now()}@test.com`;
    await page.getByPlaceholder('teammate@company.com').fill(email);
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    
    // Wait for success message
    await expect(page.getByText('Invite Sent!')).toBeVisible({ timeout: 10000 });
    
    // Wait for auto-close timeout (2.5 seconds)
    await page.waitForTimeout(3000);
    
    // Modal should be closed
    await expect(page.getByText('Invite Teammate')).not.toBeVisible();
  });

  test('TC11: Error state with retry functionality', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const email = `error_${Date.now()}@test.com`;
    await page.getByPlaceholder('teammate@company.com').fill(email);
    
    // Intercept and fail the invitation request
    await page.route('**/functions/v1/send-invitation-email', route => {
      route.abort('failed');
    });
    
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    
    // Wait for error state
    await expect(page.getByText('Send Failed')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/error|Error/i)).toBeVisible();
    
    // Verify Try Again button exists
    const tryAgainButton = page.getByRole('button', { name: 'Try Again' });
    await expect(tryAgainButton).toBeVisible();
    
    // Click Try Again to go back to form
    await tryAgainButton.click();
    await expect(page.getByText('Invite Teammate')).toBeVisible();
  });

  test('TC12: Multiple invitations in sequence', async ({ page }) => {
    await login(page, 'Admin');

    // First invitation
    await openInviteModal(page);
    const email1 = `seq1_${Date.now()}@test.com`;
    await page.getByPlaceholder('teammate@company.com').fill(email1);
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    
    await expect(page.getByText('Invite Sent!')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2500);
    
    // Second invitation
    await openInviteModal(page);
    const email2 = `seq2_${Date.now()}@test.com`;
    await page.getByPlaceholder('teammate@company.com').fill(email2);
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    
    await expect(page.getByText('Invite Sent!')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(email2)).toBeVisible();
  });

  test('TC13: Form resets between invitations', async ({ page }) => {
    await login(page, 'Admin');
    
    // First invitation
    await openInviteModal(page);
    const email1 = `reset1_${Date.now()}@test.com`;
    
    const emailInput = page.getByPlaceholder('teammate@company.com');
    await emailInput.fill(email1);
    
    const roleSection = page.locator('div').filter({ hasText: /Security Role/ }).first();
    const adminRoleButton = roleSection.locator('button').filter({ hasText: 'ADMIN' }).first();
    await adminRoleButton.click();
    
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    await expect(page.getByText('Invite Sent!')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2500);
    
    // Second invitation - form should reset
    await openInviteModal(page);
    
    // Email should be empty
    const newEmailValue = await page.getByPlaceholder('teammate@company.com').inputValue();
    expect(newEmailValue).toBe('');
    
    // USER role should be selected by default
    const newRoleSection = page.locator('div').filter({ hasText: /Security Role/ }).first();
    const userRoleButton = newRoleSection.locator('button').filter({ hasText: /^USER$/ }).first();
    await expect(userRoleButton).toHaveClass(/border-indigo-600|bg-indigo-50/);
  });

  test('TC14: Invitation with special characters in email domain', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const email = `user+test_${Date.now()}@company.co.uk`;
    await page.getByPlaceholder('teammate@company.com').fill(email);
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    
    await expect(page.getByText('Invite Sent!')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(email)).toBeVisible();
  });

  test('TC15: Verify Edge Function integration - email delivery confirmation', async ({ page }) => {
    await login(page, 'Admin');
    await openInviteModal(page);

    const email = `edge_function_${Date.now()}@test.com`;
    await page.getByPlaceholder('teammate@company.com').fill(email);
    await page.getByRole('button', { name: 'Send Invitation' }).click();
    
    // Verify success message confirms Edge Function execution
    await expect(page.getByText('Invite Sent!')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('✓ Email delivered successfully')).toBeVisible();
    await expect(page.getByText(/activation link/i)).toBeVisible();
  });

  test('TC16: Non-admin user cannot access invite functionality', async ({ page }) => {
    await login(page, 'User');
    
    // Attempt to navigate to Team & Settings
    await page.getByRole('button', { name: 'Team & Settings' }).click();
    
    // Wait for Workspace Settings to load
    await expect(page.getByRole('heading', { name: 'Workspace Settings' })).toBeVisible({ timeout: 5000 });
    
    // Verify Admin Panel button is not visible or disabled for non-admin user
    const adminPanelButton = page.getByRole('button', { name: 'Admin Panel' });
    await expect(adminPanelButton).not.toBeVisible();
  });

});

/*
  ============================================================
  HOW TO RUN THESE TESTS
  ============================================================
  
  Prerequisites:
  - Node.js and npm installed
  - Application running on http://localhost:3000
  - Supabase Edge Function 'send-invitation-email' deployed and working
  - Playwright browser installed
  
  Installation:
  npm install -D @playwright/test
  
  Run all invite tests:
  npx playwright test tests/invite.test.ts
  
  Run specific test case:
  npx playwright test tests/invite.test.ts -g "TC01"
  
  Run with UI mode (visual mode):
  npx playwright test tests/invite.test.ts --ui
  
  Run with headed mode (see browser):
  npx playwright test tests/invite.test.ts --headed
  
  Debug mode (step through tests):
  npx playwright test tests/invite.test.ts --debug
  
  Generate HTML report:
  npx playwright test tests/invite.test.ts && npx playwright show-report
  
  Run in specific browser:
  npx playwright test tests/invite.test.ts --project=firefox
  npx playwright test tests/invite.test.ts --project=webkit
  npx playwright test tests/invite.test.ts --project=chromium
  
  View test results:
  npx playwright show-report
  
  ============================================================
*/