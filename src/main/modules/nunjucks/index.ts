import * as path from 'path';
import * as express from 'express';
import * as nunjucks from 'nunjucks';
import {SelectItem} from '../../interfaces/SelectItem';

export class Nunjucks {
  constructor(public developmentMode: boolean) {
    this.developmentMode = developmentMode;
  }

  enableFor(app: express.Express): void {
    app.set('view engine', 'njk');
    const govUkFrontendPath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'node_modules',
      'govuk-frontend',
    );
    const env =  nunjucks.configure(
      [path.join(__dirname, '..', '..', 'views'), govUkFrontendPath],
      {
        autoescape: true,
        watch: this.developmentMode,
        express: app,
      },
    );
    env.addFilter('selectFilter', this.selectFilter);
  }

  private selectFilter(items: SelectItem[], selectedValue: string) {
    // Set selected property on selected item
    let itemSelected = false;
    items.forEach(item => {
      if (item.value?.toString() === selectedValue?.toString()) {
        item.selected = true;
        itemSelected = true;
      } else {
        item.selected = false;
      }
    });

    // ff we don't have a selected item, add an empty item and select this
    if (!itemSelected) {
      items.splice(0, 0, {value: '', text: '', selected: true});
    }
    return items;
  }
}
