import { Component } from '@angular/core';
import { RbDemoCaller } from 'shared-ui';

@Component({
  selector: 'mp-demo-caller-page',
  imports: [RbDemoCaller],
  template: `
    <rb-demo-caller
      #demo
      title="Simulate another app that opens MapPickBack"
      lead="Tap “Pick on map” to open the map. After Done, the pin returns here."
      startLabel="Pick on map"
    >
      @if (demo.result().value) {
        <dl class="meta" rbResult>
          <div>
            <dt>Point</dt>
            <dd>{{ demo.result().value }}</dd>
          </div>
          @if (demo.result().extras['zoom']; as zoom) {
            <div>
              <dt>Zoom</dt>
              <dd>{{ zoom }}</dd>
            </div>
          }
        </dl>
      }
    </rb-demo-caller>
  `,
  host: { class: 'rb-page rb-page--demo' },
})
export class DemoCallerPage {}
