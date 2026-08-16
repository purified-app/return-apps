import { Component } from '@angular/core';
import { RbDemoCaller } from 'shared-ui';

@Component({
  selector: 'qr-demo-caller-page',
  imports: [RbDemoCaller],
  template: `
    <rb-demo-caller
      title="Simulate another app that opens QR"
      lead="Tap “Generate QR” to encode text. After Done, the SVG data URL returns here. Use output=png for a PNG data URL (hash delivery)."
      startLabel="Generate QR"
      [params]="{ text: 'https://return.purified.app' }"
    />
  `,
  host: { class: 'rb-page rb-page--demo' },
})
export class DemoCallerPage {}
