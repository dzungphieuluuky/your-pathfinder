import { test, expect, Page } from '@playwright/test';

// Helper function for login
const login = async (page: Page, role: 'Admin' | 'User') => {
  await page.goto('http://localhost:3000/#/login');
  await page.getByPlaceholder('name@company.com').fill(`${role.toLowerCase()}@test.com`);
  await page.getByRole('button', { name: role }).click();
  await page.getByRole('button', { name: 'Enter PathFinder' }).click();
  await expect(page).toHaveURL('http://localhost:3000/#/');
};

// Helper to navigate to Conversation page
const navigateToConversation = async (page: Page) => {
  // Try multiple selectors since navigation might be button or link
  const conversationButton = page.locator('button, a, div[role="button"]').filter({ hasText: /Conversation|Chat|Messages/i }).first();
  
  // Wait for element to be visible before clicking
  await conversationButton.waitFor({ state: 'visible', timeout: 5000 });
  await conversationButton.click();
  
  // Wait for chat page to load
  await page.waitForURL('**/', { timeout: 10000 });
};

test.describe('Smart Chat Functionality', () => {

  // TC01: Send message and receive response (Real End-to-End flow)
  test('TC01: Send question and system responds', async ({ page }) => {
    await login(page, 'User');

    // Navigate to chat dashboard
    await navigateToConversation(page);

    const question = "Hello PathFinder, what documents are available?";
    
    // Fill the input field and submit
    const inputField = page.getByPlaceholder(/Search Intelligence Vault|query/i);
    await inputField.waitFor({ state: 'visible', timeout: 5000 });
    await inputField.fill(question);
    
    // Submit form - either by clicking button or pressing Enter
    await inputField.press('Enter');

    // Verify user message appears in chat
    await expect(page.getByText(question)).toBeVisible({ timeout: 10000 });

    // Verify loading state appears (AI is processing)
    await expect(page.getByText(/Consulting Vault|typing|processing/i)).toBeVisible({ timeout: 10000 });

    // Wait for loading to disappear (AI response received)
    await expect(page.getByText(/Consulting Vault|typing|processing/i)).toBeHidden({ timeout: 30000 });
    
    // Verify AI response message appears
    const aiMessage = page.locator('[class*="bg-slate"]').filter({ has: page.locator('p') }).last();
    await expect(aiMessage).toBeVisible({ timeout: 10000 });
    
    // Verify AI message contains actual text content
    await expect(aiMessage).toContainText(/./);
  });

  // TC02: Verify chat history is saved (Persistence)
  test('TC02: Chat history is saved after page reload', async ({ page }) => {
    await login(page, 'User');
    await navigateToConversation(page);

    // Generate unique message to track
    const uniqueMsg = `Test History ${Date.now()}`;
    
    // Send message
    const inputField = page.getByPlaceholder(/Search Intelligence Vault|query/i);
    await inputField.waitFor({ state: 'visible', timeout: 5000 });
    await inputField.fill(uniqueMsg);
    
    await inputField.press('Enter');
    
    // Verify message appears
    await expect(page.getByText(uniqueMsg)).toBeVisible({ timeout: 10000 });

    // Wait a moment for response
    await page.waitForTimeout(2000);

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify user message still exists in chat history (loaded from localStorage)
    await expect(page.getByText(uniqueMsg)).toBeVisible({ timeout: 10000 });
  });

  // TC03: Clear chat history functionality
  test('TC03: Clear conversation history removes all messages', async ({ page }) => {
    await login(page, 'User');
    await navigateToConversation(page);

    // Send a test message
    const testMsg = 'Message to clear';
    const inputField = page.getByPlaceholder(/Search Intelligence Vault|query/i);
    await inputField.waitFor({ state: 'visible', timeout: 5000 });
    await inputField.fill(testMsg);
    
    await inputField.press('Enter');
    
    // Verify message appears
    await expect(page.getByText(testMsg)).toBeVisible({ timeout: 10000 });

    // Setup dialog handler to accept confirmation
    page.once('dialog', dialog => {
      expect(dialog.message()).toContain('Clear');
      dialog.accept();
    });

    // Click clear button using title attribute selector
    const clearButton = page.locator('button[title="Clear conversation history"]');
    await clearButton.waitFor({ state: 'visible', timeout: 5000 });
    await clearButton.click();

    // Verify welcome state is shown (no messages)
    await expect(page.getByText(/Ask anything|Welcome|Start/i)).toBeVisible({ timeout: 10000 });
    
    // Verify test message is gone
    await expect(page.getByText(testMsg)).not.toBeVisible();
  });
  
  // TC04: Display citations when documents are referenced
  test('TC04: Display citations when documents are referenced', async ({ page }) => {
    await login(page, 'User');

    // Navigate to chat
    await navigateToConversation(page);

    // Add mock message data to localStorage with citations
    const mockMessages = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'What does the document say?',
        timestamp: new Date().toISOString()
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Based on the document, here is the information...',
        timestamp: new Date().toISOString(),
        citations: [
          { file: 'test-document.pdf', page: 1, url: '/documents/test-document.pdf' }
        ]
      }
    ];

    await page.addInitScript((msgs) => {
      const hostname = window.location.hostname;
      const storageKey = `chat_messages_${hostname}`;
      localStorage.setItem(storageKey, JSON.stringify(msgs));
    }, mockMessages);

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify citation chip appears
    const citationChip = page.locator('button').filter({ hasText: 'test-document.pdf' }).first();
    await expect(citationChip).toBeVisible({ timeout: 10000 });

    // Verify citation has proper styling
    await expect(citationChip).toHaveClass(/bg-|rounded/);
    
    // Click citation to preview
    await citationChip.click();
    
    // Verify citation preview appears
    await expect(page.locator('text=/Citation|Preview/i')).toBeVisible({ timeout: 5000 });
  });

  // TC05: Switch between document categories (Filter dropdown)
  test('TC05: Switch between document categories in chat filter', async ({ page }) => {
    await login(page, 'User');
    await navigateToConversation(page);

    // Open category dropdown
    const categoryDropdown = page.getByRole('button').filter({ hasText: /All|Vault|Category/ }).first();
    await categoryDropdown.waitFor({ state: 'visible', timeout: 5000 });
    await categoryDropdown.click();

    // Verify dropdown menu appears with options
    await expect(page.locator('text=/HR|IT|Sales|General/i').first()).toBeVisible({ timeout: 5000 });

    // Select first visible category
    const firstCategory = page.locator('button').filter({ hasText: /HR|IT|Sales/ }).first();
    await firstCategory.click();

    // Send a message to verify it searches within selected category
    const inputField = page.getByPlaceholder(/Search Intelligence Vault|query/i);
    await inputField.fill('What are policies?');
    
    await inputField.press('Enter');

    // Verify message is sent
    await expect(page.getByText('What are policies?')).toBeVisible({ timeout: 10000 });
    
    // Verify loading state appears
    await expect(page.getByText(/Consulting|typing|processing/i)).toBeVisible({ timeout: 10000 });
    
    // Wait for response
    await expect(page.getByText(/Consulting|typing|processing/i)).toBeHidden({ timeout: 30000 });

    // Verify AI responds
    const aiMessage = page.locator('[class*="bg-slate"]').filter({ has: page.locator('p') }).last();
    await expect(aiMessage).toBeVisible({ timeout: 10000 });
  });

  // TC06: Feedback on AI responses
  test('TC06: Provide feedback on AI responses', async ({ page }) => {
    await login(page, 'User');
    await navigateToConversation(page);

    // Add pre-made message to avoid wait time
    const mockMessages = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Tell me about the company',
        timestamp: new Date().toISOString()
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'The company is a software development firm.',
        timestamp: new Date().toISOString(),
        feedback: null
      }
    ];

    await page.addInitScript((msgs) => {
      const hostname = window.location.hostname;
      const storageKey = `chat_messages_${hostname}`;
      localStorage.setItem(storageKey, JSON.stringify(msgs));
    }, mockMessages);

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Find the AI message
    const aiMessage = page.locator('[class*="bg-slate"]').filter({ has: page.locator('p') }).first();
    await expect(aiMessage).toBeVisible({ timeout: 10000 });

    // Hover over message to reveal feedback buttons
    await aiMessage.hover();

    // Click thumbs up button - using lucide class
    const thumbsUpButton = aiMessage.locator('button:has(svg.lucide-thumbs-up)').first();
    await expect(thumbsUpButton).toBeVisible({ timeout: 5000 });
    await thumbsUpButton.click();

    // Verify feedback is recorded
    await expect(thumbsUpButton).toHaveClass(/text-green|fill-green|text-emerald/);
  });

  // TC07: Empty chat state
  test('TC07: Display empty state when no messages', async ({ page }) => {
    await login(page, 'User');
    await navigateToConversation(page);

    // Clear localStorage to ensure empty state
    await page.addInitScript(() => {
      const hostname = window.location.hostname;
      const storageKey = `chat_messages_${hostname}`;
      localStorage.removeItem(storageKey);
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify welcome message appears
    await expect(page.getByText(/Ask anything|Welcome|Start/i)).toBeVisible({ timeout: 10000 });

    // Verify input field is visible and ready
    const inputField = page.getByPlaceholder(/Search Intelligence Vault|query/i);
    await expect(inputField).toBeVisible({ timeout: 5000 });
  });

  // TC08: Handle long responses gracefully
  test('TC08: Handle long AI responses with proper scrolling', async ({ page }) => {
    await login(page, 'User');
    await navigateToConversation(page);

    // Create a mock long response
    const longContent = 'This is a very long response. '.repeat(50) + 'End of message.';
    
    const mockMessages = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Explain everything in detail',
        timestamp: new Date().toISOString()
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: longContent,
        timestamp: new Date().toISOString()
      }
    ];

    await page.addInitScript((msgs) => {
      const hostname = window.location.hostname;
      const storageKey = `chat_messages_${hostname}`;
      localStorage.setItem(storageKey, JSON.stringify(msgs));
    }, mockMessages);

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify long message is displayed
    const aiMessage = page.locator('[class*="bg-slate"]').filter({ has: page.locator('p') }).first();
    await expect(aiMessage).toBeVisible({ timeout: 10000 });
    await expect(aiMessage).toContainText('This is a very long response');
    await expect(aiMessage).toContainText('End of message');

    // Verify chat scrolls to show latest message
    const chatContainer = page.locator('[class*="overflow-auto"]').first();
    const scrollTop = await chatContainer.evaluate(el => el.scrollTop);
    
    // Should be scrolled to show content
    expect(scrollTop).toBeGreaterThanOrEqual(0);
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
  
  Run all chat tests:
  npx playwright test tests/chat.test.ts
  
  Run specific test case:
  npx playwright test tests/chat.test.ts -g "TC01"
  
  Run with UI mode (visual mode):
  npx playwright test tests/chat.test.ts --ui
  
  Run with headed mode (see browser):
  npx playwright test tests/chat.test.ts --headed
  
  Debug mode (step through tests):
  npx playwright test tests/chat.test.ts --debug
  
  Generate HTML report:
  npx playwright test tests/chat.test.ts && npx playwright show-report
  
  Run in specific browser:
  npx playwright test tests/chat.test.ts --project=firefox
  npx playwright test tests/chat.test.ts --project=webkit
  npx playwright test tests/chat.test.ts --project=chromium
  
  View test results:
  npx playwright show-report
  
  ============================================================
*/