import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import type { SortOption } from '../test-data/products';

export interface DisplayedProduct {
  name: string;
  price: string;
  description: string;
  imageSrc: string;
}

export class InventoryPage extends BasePage {
  readonly title: Locator;
  readonly inventoryList: Locator;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly itemDescriptions: Locator;
  readonly itemImages: Locator;
  readonly sortDropdown: Locator;
  readonly activeSortOption: Locator;
  readonly footer: Locator;
  readonly footerCopy: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByTestId('title');
    this.inventoryList = page.getByTestId('inventory-list');
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.itemDescriptions = page.getByTestId('inventory-item-desc');
    this.itemImages = this.items.getByRole('img');
    this.sortDropdown = page.getByTestId('product-sort-container');
    this.activeSortOption = page.getByTestId('active-option');
    this.footer = page.getByTestId('footer');
    this.footerCopy = page.getByTestId('footer-copy');
  }

  async goto(): Promise<void> {
    await this.page.goto('/inventory.html');
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/inventory\.html$/);
    await expect(this.title).toHaveText('Products');
    await expect(this.inventoryList).toBeVisible();
  }

  item(productName: string): Locator {
    return this.items.filter({ has: this.page.getByText(productName, { exact: true }) });
  }

  addToCartButton(productName: string): Locator {
    return this.item(productName).getByRole('button', { name: 'Add to cart' });
  }

  removeButton(productName: string): Locator {
    return this.item(productName).getByRole('button', { name: 'Remove' });
  }

  async addToCart(...productNames: string[]): Promise<void> {
    for (const name of productNames) {
      await this.addToCartButton(name).click();
      await expect(this.removeButton(name)).toBeVisible();
    }
  }

  async removeFromCart(...productNames: string[]): Promise<void> {
    for (const name of productNames) {
      await this.removeButton(name).click();
      await expect(this.addToCartButton(name)).toBeVisible();
    }
  }

  async openProduct(productName: string): Promise<void> {
    await this.item(productName).getByTestId('inventory-item-name').click();
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }

  async getNames(): Promise<string[]> {
    return this.itemNames.allInnerTexts();
  }

  async getPrices(): Promise<string[]> {
    return this.itemPrices.allInnerTexts();
  }

  async getDisplayedProducts(): Promise<DisplayedProduct[]> {
    const count = await this.items.count();
    const result: DisplayedProduct[] = [];
    for (let i = 0; i < count; i++) {
      const card = this.items.nth(i);
      result.push({
        name: await card.getByTestId('inventory-item-name').innerText(),
        price: await card.getByTestId('inventory-item-price').innerText(),
        description: await card.getByTestId('inventory-item-desc').innerText(),
        imageSrc: (await card.getByRole('img').getAttribute('src')) ?? '',
      });
    }
    return result;
  }
}
