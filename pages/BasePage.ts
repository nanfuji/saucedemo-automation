import type { Page } from '@playwright/test';
import { Header } from './components/Header';

export abstract class BasePage {
  readonly header: Header;

  protected constructor(readonly page: Page) {
    this.header = new Header(page);
  }
}
