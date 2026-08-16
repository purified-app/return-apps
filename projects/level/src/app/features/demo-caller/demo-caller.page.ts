import { Component } from '@angular/core';
import { RbDemoCaller } from 'shared-ui';

@Component({
  selector: 'lv-demo-caller-page',
  imports: [RbDemoCaller],
  template: `
    <rb-demo-caller
      #demo
      title="Simulate another app that opens Level"
      lead="Tap “Open Level” to take a compass, spirit-level, or incline reading. After success, the reading returns here."
      startLabel="Open Level"
    >
      @if (demo.result().value) {
        <dl class="meta" rbResult>
          @if (demo.result().extras['mode']; as mode) {
            <div>
              <dt>Mode</dt>
              <dd>{{ mode }}</dd>
            </div>
          }
          @if (demo.result().extras['heading']; as heading) {
            <div>
              <dt>Heading</dt>
              <dd>{{ heading }}°</dd>
            </div>
          }
          @if (demo.result().extras['pitch']; as pitch) {
            <div>
              <dt>Pitch</dt>
              <dd>{{ pitch }}°</dd>
            </div>
          }
          @if (demo.result().extras['roll']; as roll) {
            <div>
              <dt>Roll</dt>
              <dd>{{ roll }}°</dd>
            </div>
          }
          @if (demo.result().extras['incline']; as incline) {
            <div>
              <dt>Incline</dt>
              <dd>{{ incline }}°</dd>
            </div>
          }
        </dl>
      }
    </rb-demo-caller>
  `,
  host: { class: 'rb-page rb-page--demo' },
})
export class DemoCallerPage {}
