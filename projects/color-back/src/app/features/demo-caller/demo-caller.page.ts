import { Component } from '@angular/core';
import { RbDemoCaller } from 'shared-ui';

@Component({
  selector: 'cb-demo-caller-page',
  imports: [RbDemoCaller],
  template: `
    <rb-demo-caller
      #demo
      title="Simulate another app that opens ColorBack"
      lead="Tap “Pick color” to open the eyedropper. After Use color, the value returns here."
      startLabel="Pick color"
    >
      @if (demo.result().value; as hex) {
        <div class="swatch-row" rbResult>
          <span class="swatch" [style.background]="hex" aria-hidden="true"></span>
          @if (demo.result().extras['rgb']; as rgb) {
            <p class="lead">RGB {{ rgb }}</p>
          }
        </div>
      }
    </rb-demo-caller>
  `,
  styleUrl: './demo-caller.page.css',
  host: { class: 'rb-page rb-page--demo' },
})
export class DemoCallerPage {}
