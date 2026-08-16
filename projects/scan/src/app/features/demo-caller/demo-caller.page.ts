import { Component } from '@angular/core';
import { RbDemoCaller } from 'shared-ui';

@Component({
  selector: 'sc-demo-caller-page',
  imports: [RbDemoCaller],
  template: `
    <rb-demo-caller
      title="Simulate another app that opens Scan"
      lead="Tap “Scan” to open the scanner. After a successful read, the value returns here."
      startLabel="Scan"
    />
  `,
  host: { class: 'rb-page rb-page--demo' },
})
export class DemoCallerPage {}
