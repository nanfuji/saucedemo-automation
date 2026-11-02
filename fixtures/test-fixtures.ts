import { test as base, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { ProductDetailsPage } from '../pages/ProductDetailsPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { OverviewPage } from '../pages/OverviewPage';
import { CheckoutCompletePage } from '../pages/CheckoutCompletePage';
import { users, type UserCredentials } from '../test-data/users';
import { validCustomer, type CustomerInfo } from '../test-data/checkout';

/** Multi-page business flows reused across specs so login/cart/checkout logic lives in one place. */
export class ShopFlows {
  constructor(
    private readonly loginPage: LoginPage,
    private readonly inventoryPage: InventoryPage,
    private readonly cartPage: CartPage,
    private readonly checkoutPage: CheckoutPage,
    private readonly overviewPage: OverviewPage,
  ) {}

  async loginAs(user: UserCredentials = users.standard): Promise<InventoryPage> {
    await this.loginPage.goto();
    await this.loginPage.loginAs(user);
    await this.inventoryPage.expectLoaded();
    return this.inventoryPage;
  }

  async addToCartAndOpenCart(productNames: string[]): Promise<CartPage> {
    await this.inventoryPage.addToCart(...productNames);
    await this.inventoryPage.header.expectCartCount(productNames.length);
    await this.inventoryPage.header.openCart();
    await this.cartPage.expectLoaded();
    return this.cartPage;
  }

  async goToCheckoutInformation(productNames: string[]): Promise<CheckoutPage> {
    await this.addToCartAndOpenCart(productNames);
    await this.cartPage.checkout();
    await this.checkoutPage.expectLoaded();
    return this.checkoutPage;
  }

  async goToOverview(productNames: string[], customer: CustomerInfo = validCustomer): Promise<OverviewPage> {
    await this.goToCheckoutInformation(productNames);
    await this.checkoutPage.submitInformation(customer);
    await this.overviewPage.expectLoaded();
    return this.overviewPage;
  }
}

interface PageFixtures {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  productDetailsPage: ProductDetailsPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  overviewPage: OverviewPage;
  completePage: CheckoutCompletePage;
  shop: ShopFlows;
  /** Logs in as standard_user before the test body runs and returns the inventory page. */
  loggedInInventory: InventoryPage;
  /** Auto fixture: adds Allure labels (module feature, known-defect tag). */
  allureMetadata: void;
}

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  productDetailsPage: async ({ page }, use) => use(new ProductDetailsPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  overviewPage: async ({ page }, use) => use(new OverviewPage(page)),
  completePage: async ({ page }, use) => use(new CheckoutCompletePage(page)),
  shop: async ({ loginPage, inventoryPage, cartPage, checkoutPage, overviewPage }, use) =>
    use(new ShopFlows(loginPage, inventoryPage, cartPage, checkoutPage, overviewPage)),
  loggedInInventory: async ({ shop }, use) => use(await shop.loginAs(users.standard)),
  allureMetadata: [
    async ({}, use, testInfo) => {
      const moduleTitle = testInfo.titlePath.find((title) => title.startsWith('Module '));
      if (moduleTitle) {
        await allure.epic('SauceDemo E2E');
        await allure.feature(moduleTitle.replace(/(\s+@\w+)+$/, ''));
      }
      await use();
      const notes = testInfo.annotations.filter((annotation) =>
        ['known-defect', 'observation', 'performance'].includes(annotation.type)
      );
      for (const type of new Set(notes.map((note) => note.type))) {
        await allure.tag(type);
      }
      if (notes.length > 0) {
        await allure.description(notes.map((note) => `- **${note.type}**: ${note.description ?? ''}`).join('\n'));
      }
    },
    { auto: true },
  ],
});

export { expect };
