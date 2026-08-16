import { Component } from '@angular/core';
import { RbDemoCaller } from 'shared-ui';

@Component({
  selector: 'cm-demo-caller-page',
  imports: [RbDemoCaller],
  template: `
    <rb-demo-caller
      #demo
      title="Simulate another app that opens Compass"
      lead="Tap “Open Compass” to take a heading. After success, the reading returns here."
      startLabel="Open Compass"
    >
      @if (demo.result().value) {
        <dl class="meta" rbResult>
          @if (demo.result().extras['heading']; as heading) {
            <div>
              <dt>Heading</dt>
              <dd>{{ heading }}°</dd>
            </div>
          }
        </dl>
      }
    </rb-demo-caller>
  `,
  host: { class: 'rb-page rb-page--demo' },
})
export class DemoCallerPage {}
