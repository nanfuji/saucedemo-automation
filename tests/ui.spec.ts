import { test, expect } from '../fixtures/test-fixtures';
import { allProducts, products } from '../test-data/products';

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 },
];

test.describe('Module 8: UI & General Validation @ui', () => {
  test('UI-001: website logo is displayed on login and inventory pages', async ({ loginPage, shop, inventoryPage }) => {
    await loginPage.goto();
    await expect(loginPage.logo).toBeVisible();
    await expect(loginPage.logo).toHaveText('Swag Labs');

    await shop.loginAs();
    await expect(inventoryPage.header.logo).toBeVisible();
    await expect(inventoryPage.header.logo).toHaveText('Swag Labs');
  });

  test('UI-002: page title is "Swag Labs" across the purchase flow', async ({ page, loginPage, shop }) => {
    await loginPage.goto();
    await expect(page).toHaveTitle('Swag Labs');

    await shop.loginAs();
    await expect(page).toHaveTitle('Swag Labs');

    await shop.goToCheckoutInformation([products.backpack.name]);
    await expect(page).toHaveTitle('Swag Labs');
  });

  test('UI-003: primary buttons are visible and enabled', async ({ loginPage, shop, inventoryPage, cartPage }) => {
    await loginPage.goto();
    await expect(loginPage.loginButton).toBeEnabled();

    await shop.loginAs();
    await expect(inventoryPage.header.menuButton).toBeEnabled();
    await expect(inventoryPage.sortDropdown).toBeEnabled();
    const addButtons = inventoryPage.page.getByRole('button', { name: 'Add to cart' });
    await expect(addButtons).toHaveCount(allProducts.length);
    for (const button of await addButtons.all()) {
      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();
    }

    await inventoryPage.header.openCart();
    await expect(cartPage.continueShoppingButton).toBeEnabled();
    await expect(cartPage.checkoutButton).toBeEnabled();
  });

  test('UI-004: product cards are laid out in an aligned two-column grid on desktop', async ({ page, loggedInInventory: inventory }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const boxes = [];
    for (const card of await inventory.items.all()) {
      const box = await card.boundingBox();
      expect(box).not.toBeNull();
      boxes.push(box!);
      await expect(card.getByTestId('inventory-item-price')).toBeVisible();
      await expect(card.getByRole('button', { name: 'Add to cart' })).toBeVisible();
    }

    const widths = new Set(boxes.map((b) => Math.round(b.width)));
    expect(widths.size).toBe(1);
    const columns = new Set(boxes.map((b) => Math.round(b.x)));
    expect(columns.size).toBe(2);
    for (let i = 0; i < boxes.length; i += 2) {
      expect(Math.round(boxes[i].y)).toBe(Math.round(boxes[i + 1].y));
      expect(boxes[i].x + boxes[i].width).toBeLessThanOrEqual(boxes[i + 1].x);
    }
  });

  test('UI-005: every product exposes working title and image links', async ({ page, loggedInInventory: inventory, productDetailsPage }) => {
    for (const product of allProducts) {
      await expect(page.getByTestId(`item-${product.id}-title-link`)).toHaveText(product.name);
      await expect(page.getByTestId(`item-${product.id}-img-link`)).toBeVisible();
    }

    for (const product of [products.fleeceJacket, products.redTShirt]) {
      await page.getByTestId(`item-${product.id}-img-link`).click();
      await productDetailsPage.expectLoaded(product.id);
      await expect(productDetailsPage.name).toHaveText(product.name);
      await productDetailsPage.backToProducts();
      await inventory.expectLoaded();
    }
  });

  test('UI-006: shopping cart icon is visible, reflects count and opens the cart', async ({ loggedInInventory: inventory, cartPage }) => {
    await expect(inventory.header.cartLink).toBeVisible();
    await inventory.header.expectCartCount(0);

    await inventory.addToCart(products.backpack.name, products.onesie.name);
    await expect(inventory.header.cartBadge).toBeVisible();
    await inventory.header.expectCartCount(2);

    await inventory.header.cartLink.click();
    await cartPage.expectLoaded();
  });

  test('UI-007: footer social media links point to Sauce Labs profiles', async ({ loggedInInventory: inventory, page }) => {
    const socialLinks = [
      { name: 'X', href: 'https://x.com/saucelabs' },
      { name: 'Facebook', href: 'https://www.facebook.com/saucelabs' },
      { name: 'LinkedIn', href: 'https://www.linkedin.com/company/sauce-labs/' },
    ];
    await expect(inventory.footer).toBeVisible();
    for (const social of socialLinks) {
      const link = inventory.footer.getByRole('link', { name: social.name, exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', social.href);
      await expect(link).toHaveAttribute('target', '_blank');
    }
    await expect(inventory.footerCopy).toHaveText(/© \d{4} Sauce Labs\. All Rights Reserved\./);

    // Opening a social link must not navigate away from the shop.
    const popupPromise = page.context().waitForEvent('page');
    await inventory.footer.getByRole('link', { name: 'LinkedIn' }).click();
    const popup = await popupPromise;
    expect(popup.url()).toContain('linkedin.com');
    await popup.close();
    await inventory.expectLoaded();
  });

  for (const viewport of viewports) {
    test(`UI-008: layout remains usable at ${viewport.name} size (${viewport.width}x${viewport.height})`, async ({ page, loggedInInventory: inventory }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await expect(inventory.header.menuButton).toBeVisible();
      await expect(inventory.header.cartLink).toBeVisible();
      await expect(inventory.sortDropdown).toBeVisible();
      const [scrollWidth, innerWidth] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
      expect(scrollWidth, 'page should not scroll horizontally').toBeLessThanOrEqual(innerWidth);

      for (const card of await inventory.items.all()) {
        await card.scrollIntoViewIfNeeded();
        const box = await card.boundingBox();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
      }

      await inventory.addToCart(products.backpack.name);
      await inventory.header.expectCartCount(1);
    });
  }
});
