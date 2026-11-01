import { test, expect } from '../fixtures/test-fixtures';
import { allProducts, products, sortScenarios } from '../test-data/products';
import { expectedSortedNames, parsePriceToCents } from '../utils/helpers';

test.describe('Module 2: Inventory & Product Catalog @inventory', () => {
  test('INV-001: inventory page loads with header, sorting and product list', async ({ loggedInInventory: inventory }) => {
    await inventory.expectLoaded();
    await expect(inventory.header.logo).toHaveText('Swag Labs');
    await expect(inventory.sortDropdown).toBeVisible();
    await expect(inventory.activeSortOption).toHaveText('Name (A to Z)');
    await expect(inventory.header.cartBadge).toHaveCount(0);
  });

  test('INV-002: all six products are displayed', async ({ loggedInInventory: inventory }) => {
    await expect(inventory.items).toHaveCount(allProducts.length);
    await expect(inventory.itemNames).toHaveCount(6);
    await expect(inventory.itemPrices).toHaveCount(6);
    await expect(inventory.page.getByRole('button', { name: 'Add to cart' })).toHaveCount(6);
  });

  test('INV-003: product names match the catalog (default A to Z order)', async ({ loggedInInventory: inventory }) => {
    const expected = expectedSortedNames(allProducts, { field: 'name', direction: 'asc' });
    await expect(inventory.itemNames).toHaveText(expected);
  });

  test('INV-004: product prices match the catalog', async ({ loggedInInventory: inventory }) => {
    for (const product of allProducts) {
      await expect(inventory.item(product.name).getByTestId('inventory-item-price')).toHaveText(product.price);
    }
  });

  test('INV-005: product descriptions are present and correct', async ({ loggedInInventory: inventory }) => {
    for (const product of allProducts) {
      const description = inventory.item(product.name).getByTestId('inventory-item-desc');
      await expect(description).toContainText(product.descriptionStartsWith);
    }
  });

  test('INV-006: product images load with correct asset and alt text', async ({ loggedInInventory: inventory }) => {
    for (const product of allProducts) {
      const image = inventory.item(product.name).getByRole('img', { name: product.name });
      await expect(image).toBeVisible();
      await expect(image).toHaveAttribute('src', new RegExp(product.imageFragment));
      await expect
        .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), {
          message: `${product.name} image should be decoded`,
        })
        .toBe(true);
    }
  });

  for (const scenario of sortScenarios) {
    test(`${scenario.id}: sort products by ${scenario.label}`, async ({ loggedInInventory: inventory }) => {
      await inventory.sortBy(scenario.option);

      await expect(inventory.activeSortOption).toHaveText(scenario.label);
      await expect(inventory.items).toHaveCount(allProducts.length);
      const expectedNames = expectedSortedNames(allProducts, scenario);
      if (scenario.field === 'name') {
        await expect(inventory.itemNames).toHaveText(expectedNames);
      } else {
        const expectedPrices = expectedNames.map((name) => allProducts.find((p) => p.name === name)!.price);
        await expect(inventory.itemPrices).toHaveText(expectedPrices);
        const cents = (await inventory.getPrices()).map(parsePriceToCents);
        const sortedCents = [...cents].sort((a, b) => (scenario.direction === 'asc' ? a - b : b - a));
        expect(cents).toEqual(sortedCents);
      }
    });
  }

  test('INV-011: open individual product details via name and image links', async ({ loggedInInventory: inventory, productDetailsPage }) => {
    await inventory.openProduct(products.backpack.name);
    await productDetailsPage.expectLoaded(products.backpack.id);
    await expect(productDetailsPage.name).toHaveText(products.backpack.name);

    await productDetailsPage.backToProducts();
    await inventory.item(products.bikeLight.name).getByRole('img').click();
    await productDetailsPage.expectLoaded(products.bikeLight.id);
    await expect(productDetailsPage.name).toHaveText(products.bikeLight.name);
  });

  for (const product of allProducts) {
    test(`INV-012: detail page information matches inventory for "${product.name}"`, async ({ loggedInInventory: inventory, productDetailsPage }) => {
      const card = inventory.item(product.name);
      const listed = {
        description: await card.getByTestId('inventory-item-desc').innerText(),
        price: await card.getByTestId('inventory-item-price').innerText(),
        imageSrc: await card.getByRole('img').getAttribute('src'),
      };

      await inventory.openProduct(product.name);

      await productDetailsPage.expectLoaded(product.id);
      await expect(productDetailsPage.name).toHaveText(product.name);
      await expect(productDetailsPage.price).toHaveText(listed.price);
      await expect(productDetailsPage.price).toHaveText(product.price);
      await expect(productDetailsPage.description).toHaveText(listed.description);
      await expect(productDetailsPage.image).toHaveAttribute('src', listed.imageSrc ?? '');
      await expect(productDetailsPage.addToCartButton).toBeEnabled();
    });
  }

  test('INV-013: return to inventory from product details', async ({ loggedInInventory: inventory, productDetailsPage }) => {
    await inventory.sortBy('hilo');
    await inventory.openProduct(products.onesie.name);
    await productDetailsPage.expectLoaded(products.onesie.id);

    await productDetailsPage.backToProducts();

    await inventory.expectLoaded();
    await expect(inventory.items).toHaveCount(6);
  });
});
