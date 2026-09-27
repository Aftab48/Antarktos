import { test, expect } from '@playwright/test'

import en from '../../src/i18n/en.json'
import hi from '../../src/i18n/hi.json'

test.describe('Frontend', () => {
  test('home page in English and Hindi', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveTitle(en['site.name'])
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator('h1').first()).toHaveText(en['home.title'])

    await page.getByRole('link', { name: en['lang.switch'] }).click()
    await expect(page).toHaveURL(/\/hi$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi')
    await expect(page.locator('h1').first()).toHaveText(hi['home.title'])
  })
})
