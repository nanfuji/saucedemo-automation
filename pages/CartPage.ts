import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  readonly title: Locator;
  readonly cartList: Locator;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly itemQuantities: Locator;
  readonly continueShoppingButton: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByTestId('title');
    this.cartList = page.getByTestId('cart-list');
    this.items = this.cartList.getByTestId('inventory-item');
    this.itemNames = this.items.getByTestId('inventory-item-name');
    this.itemPrices = this.items.getByTestId('inventory-item-price');
    this.itemQuantities = this.items.getByTestId('item-quantity');
    this.continueShoppingButton = page.getByRole('button', { name: 'Continue Shopping' });
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/cart.html');
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/cart\.html$/);
    await expect(this.title).toHaveText('Your Cart');
  }

  item(productName: string): Locator {
    return this.items.filter({ has: this.page.getByText(productName, { exact: true }) });
  }

  async removeItem(productName: string): Promise<void> {
    await this.item(productName).getByRole('button', { name: 'Remove' }).click();
    await expect(this.item(productName)).toHaveCount(0);
  }

  async getNames(): Promise<string[]> {
    return this.itemNames.allInnerTexts();
  }

  async getPrices(): Promise<string[]> {
    return this.itemPrices.allInnerTexts();
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
