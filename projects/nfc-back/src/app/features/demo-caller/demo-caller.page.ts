import { Component } from '@angular/core';
import { RbDemoCaller } from 'shared-ui';

@Component({
  selector: 'nb-demo-caller-page',
  imports: [RbDemoCaller],
  template: `
    <rb-demo-caller
      #demo
      title="Simulate another app that opens NfcBack"
      lead="Tap “Scan NFC” to open the reader. After a successful read, the value returns here."
      startLabel="Scan NFC"
    >
      @if (demo.result().value) {
        <dl class="meta" rbResult>
          <div>
            <dt>NFC</dt>
            <dd>{{ demo.result().value }}</dd>
          </div>
          @if (demo.result().extras['recordType']; as recordType) {
            <div>
              <dt>Record</dt>
              <dd>{{ recordType }}</dd>
            </div>
          }
        </dl>
      }
    </rb-demo-caller>
  `,
  host: { class: 'rb-page rb-page--demo' },
})
export class DemoCallerPage {}
