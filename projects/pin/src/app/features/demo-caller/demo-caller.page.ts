import { Component } from '@angular/core';
import { RbDemoCaller } from 'shared-ui';

@Component({
  selector: 'pb-demo-caller-page',
  imports: [RbDemoCaller],
  template: `
    <rb-demo-caller
      title="Simulate another app that opens Pin"
      lead="Tap “Enter PIN” to open the keypad. After Done, the PIN returns here."
      startLabel="Enter PIN"
      delivery="hash"
      [params]="{ length: 4 }"
    />
  `,
  host: { class: 'rb-page rb-page--demo' },
})
export class DemoCallerPage {}
