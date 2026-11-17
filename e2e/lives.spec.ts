import fs from 'node:fs';
import { test, expect } from '@playwright/test';

test('a head who dies is remembered on the succession screen', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  const title = await page.evaluate(async () => {
    const path = '/src/engine.ts';
    const e = await import(path);
    for (const seed of [1, 2, 3, 4, 6, 8]) {
      let s = e.create(seed, 0, 'commoner');
      for (let n = 0; n < 200 && s.phase === 'play'; n++) {
        s = e.continueStory(s);
        if (s.chapterEnd || s.phase !== 'play') continue;
        const index = e
          .currentEvent(s)
          .choices.findIndex((_: unknown, i: number) => e.choiceAvailable(s, i));
        s = e.choose(s, index);
      }
      s = e.continueStory(s);
      if (s.phase !== 'succession') continue;
      localStorage.setItem('thousand-lineage-v1', JSON.stringify(s));
      return e.lifeOf(s, s.head).title as string;
    }
    return '';
  });
  expect(title).not.toBe('');
  await page.reload();
  await expect(page.locator('.life-title')).toHaveText(title);
  await expect(page.locator('.life-facts')).toContainText('대표로');
  await page.locator('.representative-memory').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `test-results/${info.project.name}-life-remembered.png` });
  await page
    .getByRole('button', { name: /생애 보기|함께한 삶 돌아보기/ })
    .first()
    .click();
  await expect(page.getByRole('dialog').locator('.life-title')).toHaveText(title);
  await expect(page.locator('.life-share button')).toHaveCount(2);
  // The share card is drawn on the device: check it is a real PNG of the expected size.
  const card = await page.evaluate(async () => {
    const [share, engine] = await Promise.all([
      import('/src/life-share.tsx' as string),
      import('/src/engine.ts' as string),
    ]);
    const s = JSON.parse(localStorage.getItem('thousand-lineage-v1')!);
    const blob: Blob = await share.lifeImage(s, engine.lifeOf(s, s.head));
    const bytes = new Uint8Array(await blob.arrayBuffer());
    return { type: blob.type, base64: btoa(String.fromCharCode(...bytes)) };
  });
  expect(card.type).toBe('image/png');
  const png = Buffer.from(card.base64, 'base64');
  expect(png.readUInt32BE(16)).toBe(1080);
  expect(png.length).toBeGreaterThan(5000);
  fs.writeFileSync(`test-results/${info.project.name}-life-card.png`, png);
  expect(errors).toEqual([]);
});
