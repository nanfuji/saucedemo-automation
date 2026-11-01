import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductDetailsPage extends BasePage {
  readonly name: Locator;
  readonly description: Locator;
  readonly price: Locator;
  readonly image: Locator;
  readonly addToCartButton: Locator;
  readonly removeButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    super(page);
    const container = page.getByTestId('inventory-container');
    this.name = container.getByTestId('inventory-item-name');
    this.description = container.getByTestId('inventory-item-desc');
    this.price = container.getByTestId('inventory-item-price');
    this.image = container.getByRole('img');
    this.addToCartButton = page.getByRole('button', { name: 'Add to cart' });
    this.removeButton = page.getByRole('button', { name: 'Remove' });
    this.backButton = page.getByRole('button', { name: 'Back to products' });
  }

  async goto(productId: number): Promise<void> {
    await this.page.goto(`/inventory-item.html?id=${productId}`);
  }

  async expectLoaded(productId?: number): Promise<void> {
    await expect(this.page).toHaveURL(productId === undefined ? /inventory-item\.html\?id=\d+/ : new RegExp(`inventory-item\\.html\\?id=${productId}$`));
    await expect(this.backButton).toBeVisible();
  }

  async backToProducts(): Promise<void> {
    await this.backButton.click();
  }
}
