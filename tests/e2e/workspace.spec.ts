import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function openLibrary(page: Page) {
  await page.goto('/');
  await expect(page.locator('.snippet-card')).toHaveCount(67);
}
async function openSettings(page: Page) {
  await page.getByRole('button', { name: 'Preferences', exact: true }).click();
  return page.getByRole('dialog', { name: 'Settings', exact: true });
}
async function addSnippet(page: Page, title: string) {
  await page.getByRole('button', { name: 'New snippet' }).click();
  const form = page.getByRole('dialog', { name: 'Create snippet', exact: true });
  await form.getByLabel('Title', { exact: true }).fill(title);
  await form.getByLabel('Description', { exact: true }).fill('A useful persistent test snippet.');
  await form.getByRole('textbox', { name: 'Code', exact: true }).fill('const answer = 42;');
  await form.getByRole('button', { name: 'Create snippet', exact: true }).click();
  await expect(form).toBeHidden();
}

test('seed library, search, filters, keyboard resizing and reading mode', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await openLibrary(page);
  await page.getByRole('combobox', { name: 'Filter language' }).selectOption('React');
  await expect(page.locator('.snippet-card')).toHaveCount(6);
  await page.getByRole('textbox', { name: 'Search snippets' }).fill('zz-no-match');
  await expect(page.getByRole('heading', { name: 'No snippets found' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).first().click();
  await expect(page.locator('.snippet-card')).toHaveCount(67);
  const separator = page.getByRole('separator', { name: 'Resize navigation' });
  await separator.focus();
  await page.keyboard.press('ArrowRight');
  await expect(separator).toHaveAttribute('aria-valuenow', '252');
  await page.getByRole('button', { name: 'Enter reading mode' }).click();
  await expect(page.locator('.results-panel')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.locator('.results-panel')).toBeVisible();
  expect(errors).toEqual([]);
});

test('PR number two banner stays visible across workspace views on desktop and mobile', async ({ page }) => {
  await openLibrary(page);
  const heading = page.getByRole('heading', { name: 'PR number two' });
  await expect(heading).toBeVisible();
  await page.getByRole('button', { name: 'Enter reading mode' }).click();
  await expect(heading).toBeVisible();
  await page.getByRole('button', { name: 'Exit reading mode' }).click();
  const settings = await openSettings(page);
  await expect(heading).toBeVisible();
  await settings.getByRole('button', { name: 'Close settings' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.snippet-card').first().click();
  await expect(heading).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('create, reload, edit, copy, favorite and delete', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openLibrary(page);
  await addSnippet(page, 'Browser persistence test');
  await page.reload();
  await page.getByRole('textbox', { name: 'Search snippets' }).fill('Browser persistence test');
  await expect(page.locator('.snippet-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Edit snippet', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Edit snippet', exact: true });
  await editor.getByRole('textbox', { name: 'Code', exact: true }).fill('const answer = 43;');
  await editor.getByRole('button', { name: 'Save changes' }).click();
  await page.getByRole('button', { name: 'Copy code', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Code copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('const answer = 43;');
  await page.getByRole('button', { name: 'Toggle favorite', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Toggle favorite', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await page.getByRole('textbox', { name: 'Search snippets' }).fill('Browser persistence test');
  await expect(page.locator('.code-view')).toContainText('const answer = 43;');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Delete snippet', exact: true }).click();
  await expect(page.locator('.snippet-card')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.snippet-card')).toHaveCount(67);
});

test('JSON export, invalid import, clear, replace and merge', async ({ page }) => {
  await openLibrary(page);
  let settings = await openSettings(page);
  const downloadPromise = page.waitForEvent('download');
  await settings.getByRole('button', { name: 'Export library' }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  expect(backupPath).toBeTruthy();
  await settings.locator('input[type=file]').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"schemaVersion":99}') });
  await expect(settings.getByRole('alert')).toContainText('Current library is unchanged');
  page.once('dialog', dialog => dialog.accept());
  await settings.getByRole('button', { name: 'Clear local data' }).click();
  await expect(page.getByRole('heading', { name: 'Your library is empty' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your library is empty' })).toBeVisible();
  settings = await openSettings(page);
  await settings.locator('input[type=file]').setInputFiles(backupPath!);
  await settings.getByRole('button', { name: 'Replace library', exact: true }).click();
  await expect(page.locator('.snippet-card')).toHaveCount(67);
  await addSnippet(page, 'Preserve merge record');
  settings = await openSettings(page);
  await settings.locator('input[type=file]').setInputFiles(backupPath!);
  await settings.getByRole('button', { name: 'Merge library', exact: true }).click();
  await expect(page.locator('.snippet-card')).toHaveCount(68);
});

test('collections create, rename and empty-only deletion', async ({ page }) => {
  await openLibrary(page);
  await page.getByRole('button', { name: 'Manage collections', exact: true }).click();
  const manager = page.getByRole('dialog', { name: 'Manage collections' });
  await manager.getByLabel('Name', { exact: true }).fill('Browser collection');
  await manager.getByRole('button', { name: 'Create collection', exact: true }).click();
  await manager.getByRole('button', { name: 'Edit collection Browser collection', exact: true }).click();
  await manager.getByLabel('Name', { exact: true }).fill('Renamed collection');
  await manager.getByRole('button', { name: 'Save collection', exact: true }).click();
  await expect(manager.getByRole('button', { name: 'Delete collection React Patterns', exact: true })).toBeDisabled();
  page.once('dialog', dialog => dialog.accept());
  await manager.getByRole('button', { name: 'Delete collection Renamed collection', exact: true }).click();
  await expect(manager.getByText('Collection deleted.', { exact: true })).toBeVisible();
});

test('command palette, theme persistence and form errors', async ({ page }) => {
  await openLibrary(page);
  await page.keyboard.press('Control+k');
  await page.getByRole('textbox', { name: 'Find command' }).fill('new');
  await page.keyboard.press('Enter');
  const editor = page.getByRole('dialog', { name: 'Create snippet' });
  await editor.getByRole('button', { name: 'Create snippet', exact: true }).click();
  await expect(editor.locator('.field-error').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(editor).toBeHidden();
  const settings = await openSettings(page);
  await settings.getByRole('button', { name: 'light', exact: true }).click();
  await page.reload();
  await expect(page.locator('.light-theme')).toHaveCount(1);
});

test('mobile browse, edit and page overflow', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openLibrary(page);
  await page.locator('.snippet-card').first().click();
  await expect(page.getByRole('button', { name: 'Back to library' })).toBeVisible();
  await page.getByRole('button', { name: 'Edit snippet', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Description', { exact: true }).fill('Edited safely on mobile browser.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('.detail-description')).toHaveText('Edited safely on mobile browser.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Back to library' }).click();
  await expect(page.locator('.results-panel')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('mobile.png') });
});

test('automated WCAG checks on library, editor and settings', async ({ page }, testInfo) => {
  test.setTimeout(90000);
  await openLibrary(page);
  const audit = async () => {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
  };
  await audit();
  await page.screenshot({ path: testInfo.outputPath('desktop-dark.png') });
  await page.getByRole('button', { name: 'New snippet' }).click();
  await audit();
  await page.keyboard.press('Escape');
  const settings = await openSettings(page);
  await audit();
  await settings.getByRole('button', { name: 'light', exact: true }).click();
  await audit();
  await page.keyboard.press('Escape');
  await audit();
  await page.screenshot({ path: testInfo.outputPath('desktop-light.png') });
  await page.getByRole('button', { name: 'New snippet' }).click();
  await audit();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+k');
  await audit();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Manage collections', exact: true }).click();
  await audit();
});

test('clipboard failure and unavailable storage have honest fallbacks', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', { get() { throw new Error('Storage denied'); } });
    Object.defineProperty(navigator, 'clipboard', { value: undefined });
  });
  await openLibrary(page);
  await expect(page.locator('.storage-warning')).toContainText('Changes will last this session');
  await page.getByRole('button', { name: 'Copy code', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('manual copying');
  await addSnippet(page, 'Memory-only test');
  await expect(page.locator('.snippet-card')).toHaveCount(68);
  await page.reload();
  await expect(page.locator('.snippet-card')).toHaveCount(67);
});
