import { expect, test } from '@playwright/test';

test('rentals landing describes contact-only listings', async ({ page }) => {
  const response = await page.goto('/rentals');

  expect(response?.status()).toBeLessThan(400);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('emprunter');
  await expect(page.getByText(/contactez votre voisin directement dans la messagerie/i)).toBeVisible();
  await expect(page.getByText(/modalités de location.*directement entre voisins/i)).toBeVisible();

  const body = await page.locator('body').innerText();
  expect(body).not.toMatch(/choisissez les dates/i);
  expect(body).not.toMatch(/caution/i);
  expect(body).not.toMatch(/assurance casse/i);
  expect(body).not.toMatch(/état des lieux/i);
});
