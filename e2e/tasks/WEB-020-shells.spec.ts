import { expect, test } from '@playwright/test';

// WEB-020 (half: static settings/communications shells) — browser e2e.
//
// Five admin pages were built as visual mockups with local `useState` that
// never persisted anywhere: settings/feature-flags, settings/api-keys,
// settings/webhooks, communications/announcements, communications/templates.
// Each looked functional (toggle switches, "Publier"/"Générer"/"Ajouter"
// buttons) while silently discarding whatever the operator did.
//
// None of the five has a backing table or backend endpoint today, and adding
// one is out of scope for this pass (would need a Schema Change Request per
// docs/db/COORDINATION.md). So each was converted to option (b) from the task
// spec: visibly disabled controls + an explicit "not connected to a backend"
// notice, instead of a control that looks live but drops the input on the
// floor.
//
// This spec signs in as the real seeded staff admin, loads each page, and
// asserts: (1) it renders without error, (2) the not-connected notice is
// shown, and (3) every primary action control on the page is disabled (so a
// click provably does nothing rather than silently doing nothing).
//
// Run: npx playwright test e2e/tasks/WEB-020-shells.spec.ts

test.describe.configure({ mode: 'serial', retries: 2 });

const NAV_TIMEOUT = 30_000;

const ADMIN_EMAIL = 'admin@mystreet.com';
const ADMIN_PASSWORD = 'Mystreet123';

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByPlaceholder('vous@mystreet.fr').fill(ADMIN_EMAIL);
  await page.getByPlaceholder('••••••••••').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /Se connecter/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: NAV_TIMEOUT });
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test('settings/feature-flags: renders, is labelled read-only, and every toggle is disabled', async ({
  page,
}) => {
  await page.goto('/settings/feature-flags');
  await expect(page.getByRole('heading', { name: 'Feature flags' })).toBeVisible({
    timeout: NAV_TIMEOUT,
  });
  await expect(page.getByText(/non connecté à un backend/i)).toBeVisible();
  await expect(page.getByText('Lecture seule')).toBeVisible();

  const toggles = page.getByRole('switch');
  const count = await toggles.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(toggles.nth(i)).toBeDisabled();
  }
});

test('settings/api-keys: renders, is labelled not-connected, and key actions are disabled', async ({
  page,
}) => {
  await page.goto('/settings/api-keys');
  await expect(page.getByRole('heading', { name: 'Clés API' })).toBeVisible({
    timeout: NAV_TIMEOUT,
  });
  await expect(page.getByText(/non connecté à un backend de gestion de secrets/i)).toBeVisible();

  await expect(page.getByRole('button', { name: /Générer une clé/i })).toBeDisabled();
  const copyButtons = page.getByRole('button', { name: /Copier/i });
  await expect(copyButtons.first()).toBeDisabled();
  const revokeButtons = page.getByRole('button', { name: /Révoquer/i });
  await expect(revokeButtons.first()).toBeDisabled();
});

test('settings/webhooks: renders, is labelled not-connected, and endpoint actions are disabled', async ({
  page,
}) => {
  await page.goto('/settings/webhooks');
  await expect(page.getByRole('heading', { name: 'Webhooks' })).toBeVisible({
    timeout: NAV_TIMEOUT,
  });
  await expect(page.getByText(/non connecté à un backend/i).first()).toBeVisible();

  await expect(page.getByRole('button', { name: /Ajouter un endpoint/i })).toBeDisabled();
  const replayButtons = page.getByRole('button', { name: /Rejouer/i });
  await expect(replayButtons.first()).toBeDisabled();
  const editButtons = page.getByRole('button', { name: /Modifier/i });
  await expect(editButtons.first()).toBeDisabled();
});

test('communications/announcements: renders, is labelled not-connected, and the compose form is disabled', async ({
  page,
}) => {
  await page.goto('/communications/announcements');
  await expect(page.getByRole('heading', { name: 'Annonces globales' })).toBeVisible({
    timeout: NAV_TIMEOUT,
  });
  await expect(page.getByText(/non connecté à un backend/i)).toBeVisible();

  // The whole compose form is a disabled <fieldset> — its inputs and submit
  // buttons must all be non-interactive.
  await expect(page.getByPlaceholder('Ex. Maintenance programmée…')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Publier' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Aperçu' })).toBeDisabled();
});

test('communications/templates: renders, is labelled not-connected, and edit actions are disabled', async ({
  page,
}) => {
  await page.goto('/communications/templates');
  await expect(page.getByRole('heading', { name: 'Modèles de messages' })).toBeVisible({
    timeout: NAV_TIMEOUT,
  });
  await expect(page.getByText(/non connectée à un backend/i)).toBeVisible();

  await expect(page.getByRole('button', { name: 'Nouveau modèle' })).toBeDisabled();
  const editButtons = page.getByRole('button', { name: 'Modifier' });
  const count = await editButtons.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(editButtons.nth(i)).toBeDisabled();
  }
});
