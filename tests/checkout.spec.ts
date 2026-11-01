import { test, expect } from '../fixtures/test-fixtures';
import { allProducts, products } from '../test-data/products';
import { checkoutValidationScenarios, unusualInputScenarios, validCustomer } from '../test-data/checkout';
import { calculateOrderTotals, formatCents, parsePriceToCents } from '../utils/helpers';

const defaultSelection = [products.backpack.name, products.bikeLight.name];

test.describe('Module 4: Checkout Information & Validation @checkout', () => {
  test.beforeEach(async ({ loggedInInventory: _inventory }) => {});

  test('CHK-001: proceed to checkout with products in cart', async ({ shop, checkoutPage }) => {
    await shop.goToCheckoutInformation(defaultSelection);

    await checkoutPage.expectLoaded();
    await expect(checkoutPage.firstNameInput).toBeEmpty();
    await expect(checkoutPage.lastNameInput).toBeEmpty();
    await expect(checkoutPage.postalCodeInput).toBeEmpty();
    await checkoutPage.header.expectCartCount(defaultSelection.length);
  });

  test('CHK-002: submit checkout form with valid information', async ({ shop, checkoutPage, overviewPage }) => {
    await shop.goToCheckoutInformation(defaultSelection);

    await checkoutPage.submitInformation(validCustomer);

    await overviewPage.expectLoaded();
    await expect(checkoutPage.errorMessage).toHaveCount(0);
  });

  for (const scenario of checkoutValidationScenarios) {
    test(`${scenario.id}: submit checkout form with ${scenario.title} shows a validation error`, async ({ shop, checkoutPage, page }) => {
      await shop.goToCheckoutInformation(defaultSelection);

      await checkoutPage.submitInformation(scenario.info);

      await checkoutPage.expectError(scenario.expectedError);
      await expect(page).toHaveURL(/checkout-step-one\.html$/);
      // Entered values are retained so the user only has to fix the missing field.
      await expect(checkoutPage.firstNameInput).toHaveValue(scenario.info.firstName);
      await expect(checkoutPage.lastNameInput).toHaveValue(scenario.info.lastName);
      await expect(checkoutPage.postalCodeInput).toHaveValue(scenario.info.postalCode);

      await checkoutPage.errorDismissButton.click();
      await expect(checkoutPage.errorMessage).toBeHidden();
    });
  }

  for (const scenario of unusualInputScenarios) {
    test(`${scenario.id}: submit checkout form with ${scenario.title} is handled without crashing`, async ({ shop, checkoutPage, overviewPage }) => {
      await shop.goToCheckoutInformation(defaultSelection);

      await checkoutPage.fillInformation(scenario.info);
      await expect(checkoutPage.firstNameInput).toHaveValue(scenario.info.firstName);
      await expect(checkoutPage.lastNameInput).toHaveValue(scenario.info.lastName);
      await checkoutPage.continueButton.click();

      await overviewPage.expectLoaded();
      await expect(overviewPage.itemNames).toHaveText(defaultSelection);
    });
  }

  test('CHK-009: cancel on checkout information returns to the cart', async ({ shop, checkoutPage, cartPage }) => {
    await shop.goToCheckoutInformation(defaultSelection);
    await checkoutPage.fillInformation(validCustomer);

    await checkoutPage.cancelButton.click();

    await cartPage.expectLoaded();
    await expect(cartPage.itemNames).toHaveText(defaultSelection);
  });

  test('CHK-010: checkout form fields are identifiable by their placeholder labels', async ({ shop, checkoutPage, page }, testInfo) => {
    await shop.goToCheckoutInformation(defaultSelection);

    const fields = [
      { locator: checkoutPage.firstNameInput, label: 'First Name' },
      { locator: checkoutPage.lastNameInput, label: 'Last Name' },
      { locator: checkoutPage.postalCodeInput, label: 'Zip/Postal Code' },
    ];
    for (const field of fields) {
      await expect(field.locator).toBeVisible();
      await expect(field.locator).toBeEditable();
      await expect(field.locator).toHaveAttribute('placeholder', field.label);
      await expect(page.getByRole('textbox', { name: field.label })).toHaveCount(1);
    }
    await expect(checkoutPage.continueButton).toHaveValue('Continue');
    await expect(checkoutPage.cancelButton).toHaveText('Cancel');

    // The form relies on placeholders only: there are no visible <label> elements.
    if ((await page.locator('form label').count()) === 0) {
      testInfo.annotations.push({ type: 'observation', description: 'Checkout fields have no visible <label>; placeholder text is the only label (accessibility gap).' });
    }
  });
});

interface CartScenario {
  title: string;
  productNames: string[];
}

const cartScenarios: CartScenario[] = [
  { title: 'single item', productNames: [products.onesie.name] },
  { title: 'three items (spec example)', productNames: [products.backpack.name, products.bikeLight.name, products.boltTShirt.name] },
  { title: 'all six items', productNames: allProducts.map((p) => p.name) },
];

test.describe('Module 5: Checkout Overview & Order Summary @checkout @order', () => {
  test.beforeEach(async ({ loggedInInventory: _inventory }) => {});

  test('ORD-001: checkout overview page loads with payment and shipping info', async ({ shop, overviewPage }) => {
    await shop.goToOverview(defaultSelection);

    await overviewPage.expectLoaded();
    await expect(overviewPage.paymentInfo).toHaveText('SauceCard #31337');
    await expect(overviewPage.shippingInfo).toHaveText('Free Pony Express Delivery!');
    await expect(overviewPage.finishButton).toBeEnabled();
    await expect(overviewPage.cancelButton).toBeEnabled();
  });

  test('ORD-002: selected products appear in the order summary', async ({ shop, overviewPage }) => {
    const selection = cartScenarios[1].productNames;
    await shop.goToOverview(selection);

    await expect(overviewPage.items).toHaveCount(selection.length);
    await expect(overviewPage.itemNames).toHaveText(selection);
    await expect(overviewPage.itemQuantities).toHaveText(selection.map(() => '1'));
  });

  test('ORD-003: product prices in the summary match inventory prices', async ({ loggedInInventory: inventory, shop, overviewPage }) => {
    const selection = cartScenarios[2].productNames;
    const inventoryPrices = new Map<string, string>();
    for (const name of selection) {
      inventoryPrices.set(name, await inventory.item(name).getByTestId('inventory-item-price').innerText());
    }

    await shop.goToOverview(selection);

    for (const name of selection) {
      const row = overviewPage.items.filter({ hasText: name });
      await expect(row.getByTestId('inventory-item-price')).toHaveText(inventoryPrices.get(name)!);
    }
  });

  for (const scenario of cartScenarios) {
    const expectedPrices = scenario.productNames.map((name) => allProducts.find((p) => p.name === name)!.price);
    const expected = calculateOrderTotals(expectedPrices);

    test(`ORD-004: item total equals the sum of product prices – ${scenario.title}`, async ({ shop, overviewPage }) => {
      await shop.goToOverview(scenario.productNames);

      const displayedPriceCents = (await overviewPage.getPrices()).map(parsePriceToCents);
      const independentSum = displayedPriceCents.reduce((a, b) => a + b, 0);
      expect(independentSum).toBe(expected.itemTotalCents);
      await expect(overviewPage.itemTotalLabel).toHaveText(`Item total: ${formatCents(expected.itemTotalCents)}`);
    });

    test(`ORD-005: tax is 8% of the item total – ${scenario.title}`, async ({ shop, overviewPage }) => {
      await shop.goToOverview(scenario.productNames);

      await expect(overviewPage.taxLabel).toHaveText(`Tax: ${formatCents(expected.taxCents)}`);
      const displayed = await overviewPage.getDisplayedTotals();
      expect(displayed.taxCents).toBe(expected.taxCents);
    });

    test(`ORD-006: final total equals item total plus tax – ${scenario.title}`, async ({ shop, overviewPage }) => {
      await shop.goToOverview(scenario.productNames);

      const displayed = await overviewPage.getDisplayedTotals();
      expect(displayed.totalCents).toBe(displayed.itemTotalCents + displayed.taxCents);
      expect(displayed).toEqual(expected);
      await expect(overviewPage.totalLabel).toHaveText(`Total: ${formatCents(expected.totalCents)}`);
    });
  }

  test('ORD-006: spec example $29.99 + $9.99 + $15.99 totals $60.45', async () => {
    const totals = calculateOrderTotals(['$29.99', '$9.99', '$15.99']);
    expect(formatCents(totals.itemTotalCents)).toBe('$55.97');
    expect(formatCents(totals.taxCents)).toBe('$4.48');
    expect(formatCents(totals.totalCents)).toBe('$60.45');
  });

  test('ORD-007: cancel on overview returns to inventory and keeps the cart', async ({ shop, overviewPage, inventoryPage }) => {
    await shop.goToOverview(defaultSelection);

    await overviewPage.cancel();

    await inventoryPage.expectLoaded();
    await inventoryPage.header.expectCartCount(defaultSelection.length);
  });

  test('ORD-008: complete checkout', async ({ shop, overviewPage, completePage }) => {
    await shop.goToOverview(defaultSelection);

    await overviewPage.finish();

    await completePage.expectLoaded();
    await expect(completePage.completeHeader).toBeVisible();
  });
});
