import { test, expect, Page } from '@playwright/test';

// Helper function for login
const login = async (page: Page, role: 'Admin' | 'User') => {
  await page.goto('http://localhost:3000/login');
  await page.getByPlaceholder('name@company.com').fill(`${role.toLowerCase()}@test.com`);
  await page.getByRole('button', { name: role }).click();
  await page.getByRole('button', { name: 'Enter PathFinder' }).click();
  await expect(page).toHaveURL('http://localhost:3000/#/');
};

test.describe('Smart Chat Functionality', () => {

  // TC01: Send message and receive response (Real End-to-End flow)
  test('TC01: Send question and system responds', async ({ page }) => {
    await login(page, 'User');

    // Navigate to chat dashboard if not already there
    await page.getByRole('link', { name: 'Conversation' }).click();

    const question = "Hello PathFinder, what documents are available?";
    
    // Fill the input field and submit
    const inputField = page.getByPlaceholder(/Search Intelligence Vault/i);
    await inputField.fill(question);
    
    // Submit form - either by clicking button or pressing Enter
    const submitButton = page.locator('button').filter({ has: page.locator('svg.lucide-send') }).first();
    await submitButton.click();

    // Verify user message appears in chat
    await expect(page.getByText(question)).toBeVisible();

    // Verify loading state appears (AI is processing)
    await expect(page.getByText(/Consulting Vault|typing/i)).toBeVisible();

    // Wait for loading to disappear (AI response received)
    await expect(page.getByText(/Consulting Vault|typing/i)).toBeHidden({ timeout: 30000 });
    
    // Verify AI response message appears (white background message)
    const aiMessage = page.locator('.bg-white.border.border-slate-200').last();
    await expect(aiMessage).toBeVisible();
    
    // Verify AI message contains actual text content
    await expect(aiMessage.locator('p')).toContainText(/./);
  });

  // TC02: Verify chat history is saved (Persistence)
  test('TC02: Chat history is saved after page reload', async ({ page }) => {
    await login(page, 'User');
    await page.getByRole('link', { name: 'Conversation' }).click();

    // Generate unique message to track
    const uniqueMsg = `Test History ${Date.now()}`;
    
    // Send message
    const inputField = page.getByPlaceholder(/Search Intelligence Vault/i);
    await inputField.fill(uniqueMsg);
    
    const submitButton = page.locator('button').filter({ has: page.locator('svg.lucide-send') }).first();
    await submitButton.click();
    
    // Verify message appears
    await expect(page.getByText(uniqueMsg)).toBeVisible();

    // Wait a moment for response
    await page.waitForTimeout(2000);

    // Reload the page
    await page.reload();

    // Verify user message still exists in chat history (loaded from localStorage)
    await expect(page.getByText(uniqueMsg)).toBeVisible();
  });

  // TC03: Clear chat history functionality
  test('TC03: Clear chat history removes all messages', async ({ page }) => {
    await login(page, 'User');
    await page.getByRole('link', { name: 'Conversation' }).click();

    // Send a test message
    const testMsg = 'Message to clear';
    const inputField = page.getByPlaceholder(/Search Intelligence Vault/i);
    await inputField.fill(testMsg);
    
    const submitButton = page.locator('button').filter({ has: page.locator('svg.lucide-send') }).first();
    await submitButton.click();
    
    // Verify message appears
    await expect(page.getByText(testMsg)).toBeVisible();

    // Setup dialog handler to accept confirmation
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('Clear all conversation history');
      dialog.accept();
    });

    // Click clear button (usually trash icon with "Clear" text)
    const clearButton = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).first();
    await clearButton.click();

    // Verify welcome state is shown (no messages)
    await expect(page.getByText(/Ask anything from the|Welcome/i)).toBeVisible();
    
    // Verify test message is gone
    await expect(page.getByText(testMsg)).not.toBeVisible();
  });

  // TC04: Display citations when documents are referenced
  test('TC04: Display citations when documents are referenced', async ({ page }) => {
    await login(page, 'User');

    // Mock chat response with citations
    await page.route('**/rest/v1/rpc/*', async route => {
      if (route.request().url().includes('match_embeddings')) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              id: 'doc-1',
              content: 'Sample document content',
              metadata: { file: 'test-document.pdf', page: 1 }
            }
          ])
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to chat
    await page.getByRole('link', { name: 'Conversation' }).click();

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

    // Verify citation chip appears
    const citationChip = page.locator('button').filter({ hasText: 'test-document.pdf' }).first();
    await expect(citationChip).toBeVisible();

    // Verify citation has proper styling
    await expect(citationChip).toHaveClass(/bg-gradient-to-r/);
    
    // Click citation to preview
    await citationChip.click();
    
    // Verify citation preview appears
    await expect(page.getByText('Citation Preview')).toBeVisible({ timeout: 5000 });
  });

  // TC05: Switch between document categories (Filter dropdown)
  test('TC05: Switch between document categories in chat filter', async ({ page }) => {
    await login(page, 'User');
    await page.getByRole('link', { name: 'Conversation' }).click();

    // Open category dropdown (default is usually "All" or "Whole Vault")
    const categoryDropdown = page.getByRole('button').filter({ hasText: /All|Whole Vault/ }).first();
    await categoryDropdown.click();

    // Verify dropdown menu appears
    await expect(page.getByRole('button', { name: 'HR' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'IT' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sales' })).toBeVisible();

    // Select HR category
    await page.getByRole('button', { name: 'HR' }).click();

    // Verify dropdown button text changed to HR
    await expect(categoryDropdown).toContainText('HR');

    // Verify prompt text changes based on selected category
    await expect(page.getByText(/Ask anything from the HR/i)).toBeVisible();

    // Send a message to verify it searches within HR category
    const inputField = page.getByPlaceholder(/Search Intelligence Vault/i);
    await inputField.fill('What are HR policies?');
    
    const submitButton = page.locator('button').filter({ has: page.locator('svg.lucide-send') }).first();
    await submitButton.click();

    // Verify message is sent with HR category filter
    await expect(page.getByText('What are HR policies?')).toBeVisible();
    
    // Verify loading state appears
    await expect(page.getByText(/Consulting|typing/i)).toBeVisible();
    
    // Wait for response
    await expect(page.getByText(/Consulting|typing/i)).toBeHidden({ timeout: 30000 });

    // Verify AI responds
    const aiMessage = page.locator('.bg-white.border.border-slate-200').last();
    await expect(aiMessage).toBeVisible();
  });

  // TC06: Feedback on AI responses
  test('TC06: Provide feedback on AI responses', async ({ page }) => {
    await login(page, 'User');
    await page.getByRole('link', { name: 'Conversation' }).click();

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

    // Find the AI message
    const aiMessage = page.locator('.bg-white.border.border-slate-200').first();
    await expect(aiMessage).toBeVisible();

    // Hover over message to reveal feedback buttons
    await aiMessage.hover();

    // Click thumbs up button
    const thumbsUpButton = aiMessage.locator('button').filter({ has: page.locator('svg.lucide-thumbs-up') }).first();
    await thumbsUpButton.click();

    // Verify feedback is recorded
    await expect(thumbsUpButton).toHaveClass(/text-green|fill-green/);
  });

  // TC07: Empty chat state
  test('TC07: Display empty state when no messages', async ({ page }) => {
    await login(page, 'User');
    await page.getByRole('link', { name: 'Conversation' }).click();

    // Clear localStorage to ensure empty state
    await page.addInitScript(() => {
      const hostname = window.location.hostname;
      const storageKey = `chat_messages_${hostname}`;
      localStorage.removeItem(storageKey);
    });

    await page.reload();

    // Verify welcome message appears
    await expect(page.getByText(/Ask anything from the|Welcome|Start a conversation/i)).toBeVisible();

    // Verify input field is visible and ready
    const inputField = page.getByPlaceholder(/Search Intelligence Vault/i);
    await expect(inputField).toBeVisible();
    await expect(inputField).toBeFocused();
  });

  // TC08: Handle long responses gracefully
  test('TC08: Handle long AI responses with proper scrolling', async ({ page }) => {
    await login(page, 'User');
    await page.getByRole('link', { name: 'Conversation' }).click();

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

    // Verify long message is displayed
    const aiMessage = page.locator('.bg-white.border.border-slate-200').first();
    await expect(aiMessage).toBeVisible();
    await expect(aiMessage).toContainText('This is a very long response');
    await expect(aiMessage).toContainText('End of message');

    // Verify chat scrolls to show latest message
    const chatContainer = page.locator('[class*="overflow-auto"]').first();
    const scrollTop = await chatContainer.evaluate(el => el.scrollTop);
    const scrollHeight = await chatContainer.evaluate(el => el.scrollHeight);
    
    // Should be scrolled near bottom
    expect(scrollTop).toBeGreaterThan(0);
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
  npx playwright test tests/chat.ts
  
  Run specific test case:
  npx playwright test tests/chat.ts -g "TC01"
  
  Run with UI mode (visual mode):
  npx playwright test tests/chat.ts --ui
  
  Run with headed mode (see browser):
  npx playwright test tests/chat.ts --headed
  
  Debug mode (step through tests):
  npx playwright test tests/chat.ts --debug
  
  Generate HTML report:
  npx playwright test tests/chat.ts && npx playwright show-report
  
  Run in specific browser:
  npx playwright test tests/chat.ts --project=firefox
  npx playwright test tests/chat.ts --project=webkit
  npx playwright test tests/chat.ts --project=chromium
  
  ============================================================
*/