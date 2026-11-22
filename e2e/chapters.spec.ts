import { test, expect } from '@playwright/test';

test('an era closes with a summary, then the story continues with the same family', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.evaluate(async () => {
    const path = '/src/engine.ts';
    const e = await import(path);
    let s = e.create(42, 0, 'commoner');
    s.year = 1549;
    s.people[s.head].born = 1520;
    s.turn = 2;
    s.event = 'life0';
    s = e.continueStory(e.choose(s, 0));
    localStorage.setItem('thousand-lineage-v1', JSON.stringify(s));
  });
  await page.reload();
  const card = page.locator('.chapter-end');
  await expect(card).toContainText('조선 전기');
  await expect(card).toContainText('다음 시대 · 전란의 시대');
  await expect(card).toContainText('이 시대의 결말 · 시대를 건넌 가문');
  const records = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('thousand-lineage-records-v1')!),
  );
  expect(records.recent[0]).toMatchObject({ endedYear: 1550, endingId: 'survivor' });
  await expect(page.locator('.choice')).toHaveCount(0);
  await page.screenshot({
    path: `test-results/${info.project.name}-chapter-end.png`,
    fullPage: true,
  });
  await card.getByRole('button', { name: '다음 시대로 →' }).click();
  await expect(card).toHaveCount(0);
  await expect(page.locator('.choice').first()).toBeVisible();
  await expect(page.locator('.game-heading h1')).toContainText('1550');
  expect(errors).toEqual([]);
});
