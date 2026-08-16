import { Component } from '@angular/core';
import { RbDemoCaller } from 'shared-ui';

@Component({
  selector: 'gb-demo-caller-page',
  imports: [RbDemoCaller],
  template: `
    <rb-demo-caller
      #demo
      title="Simulate another app that opens Geo"
      lead="Tap “Get location” to open Geo. After success, coordinates return here."
      startLabel="Get location"
    >
      @if (demo.result().value) {
        <dl class="meta" rbResult>
          <div>
            <dt>Coords</dt>
            <dd>{{ demo.result().value }}</dd>
          </div>
          @if (demo.result().extras['accuracy']; as accuracy) {
            <div>
              <dt>Accuracy</dt>
              <dd>{{ accuracy }} m</dd>
            </div>
          }
        </dl>
      }
    </rb-demo-caller>
  `,
  host: { class: 'rb-page rb-page--demo' },
})
export class DemoCallerPage {}
