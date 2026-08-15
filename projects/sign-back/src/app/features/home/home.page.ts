import { Component } from '@angular/core';
import { RbHomeDocs } from 'shared-ui';

@Component({
  selector: 'sb-home-page',
  imports: [RbHomeDocs],
  template: `
    <rb-home-docs
      brand="SignBack"
      title="Capture a signature and return it to the app you came from"
      lead="Mobile-first signature pad. After Done, the signature SVG is returned as value + format=sign.svg (hash by default)."
      ctaLabel="Start signing"
      format="sign.svg"
      delivery="hash"
      demoValue="data:image/svg+xml,…"
    />
  `,
  host: { class: 'rb-page rb-page--home' },
})
export class HomePage {}
