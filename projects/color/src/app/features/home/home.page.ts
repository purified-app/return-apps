import { Component } from '@angular/core';
import { RbHomeDocs } from 'shared-ui';

@Component({
  selector: 'cb-home-page',
  imports: [RbHomeDocs],
  template: `
    <rb-home-docs
      brand="Color"
      title="Sample a color and return it to the app you came from"
      lead="Camera eyedropper or palette picker. After Use color, hex is returned as value with format=color.hex plus rgb."
      ctaLabel="Open eyedropper"
      format="color.hex"
      [openParamDocs]="['mode', 'hex']"
      demoValue="#c45c26"
      [returnExtras]="{ rgb: '196,92,38' }"
      footnote="Camera mode needs permission and HTTPS (or localhost). Palette works without a camera."
    />
  `,
  host: { class: 'rb-page rb-page--home' },
})
export class HomePage {}
