import { Component } from '@angular/core';
import { RbHomeDocs } from 'shared-ui';

@Component({
  selector: 'qr-home-page',
  imports: [RbHomeDocs],
  template: `
    <rb-home-docs
      brand="QR"
      title="Generate a QR code and return it to the app you came from"
      lead="Type text or a URL. After Done, value is an SVG data URL (format=qr.svg), or a PNG data URL when opened with output=png (format=qr.png, delivery=hash)."
      ctaLabel="Generate QR"
      format="qr.svg"
      [openParamDocs]="['text', 'output', 'auto']"
      demoValue="data:image/svg+xml,…"
    />
  `,
  host: { class: 'rb-page rb-page--home' },
})
export class HomePage {}
