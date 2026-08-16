import { Component } from '@angular/core';
import { RbHomeDocs } from 'shared-ui';

@Component({
  selector: 'sc-home-page',
  imports: [RbHomeDocs],
  template: `
    <rb-home-docs
      brand="Scan"
      title="Scan a code and return it to the app you came from"
      lead="Camera barcode scanner. After a successful scan, the value is returned via value + format=scan.* (query by default)."
      ctaLabel="Start scanning"
      format="scan.qr_code"
      [openParamDocs]="['formats', 'batch']"
      demoValue="ABC-123"
    />
  `,
  host: { class: 'rb-page rb-page--home' },
})
export class HomePage {}
