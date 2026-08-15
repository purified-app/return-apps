import { Component } from '@angular/core';
import { RbHomeDocs } from 'shared-ui';

@Component({
  selector: 'pb-home-page',
  imports: [RbHomeDocs],
  template: `
    <rb-home-docs
      brand="PinBack"
      title="Enter a PIN and return it to the app you came from"
      lead="Fullscreen numeric keypad. After Done, the PIN is returned as value + format=pin.digits (hash by default)."
      ctaLabel="Enter PIN"
      format="pin.digits"
      delivery="hash"
      [openParams]="{ length: 4 }"
      [openParamDocs]="['mask']"
      demoValue="1234"
    />
  `,
  host: { class: 'rb-page rb-page--home' },
})
export class HomePage {}
