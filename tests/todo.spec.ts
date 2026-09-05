import { test, expect } from '@playwright/test';

test('user can add a todo', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');

    const todoInput = page.getByPlaceholder('What needs to be done?');

    await todoInput.fill('Learn Playwright with AI');
    await todoInput.press('Enter');

    await expect(page.getByText('Learn Playwright with AI')).toBeVisible();
});

test('user can complete a todo', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');

    const todoInput = page.getByPlaceholder('What needs to be done?');

    await todoInput.fill('Learn Playwright');
    await todoInput.press('Enter');

    const todo = page.getByText('Learn Playwright');

    await expect(todo).toBeVisible();
});

test('user can delete a todo', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');

    const todoInput = page.getByPlaceholder('What needs to be done?');

    await todoInput.fill('Learn AI testing');
    await todoInput.press('Enter');

    const todo = page.getByText('Learn AI testing');

    await expect(todo).toBeVisible();

    await todo.hover();

    await todo.locator('xpath=..').getByRole('button').click();

    await expect(todo).not.toBeVisible();
});