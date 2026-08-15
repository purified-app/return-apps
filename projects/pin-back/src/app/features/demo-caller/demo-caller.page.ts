import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  RbDemoCaller,
  appBaseUrl,
  buildDemoOpenUrl,
  parseReturnResult,
  type ReturnResult,
} from 'shared-ui';

@Component({
  selector: 'pb-demo-caller-page',
  imports: [RbDemoCaller],
  template: `
    <rb-demo-caller
      title="Simulate another app that opens PinBack"
      lead="Tap “Enter PIN” to open the keypad. After Done, the PIN returns here (hash delivery)."
      startLabel="Enter PIN"
      [result]="result()"
      (start)="startPin()"
    >
      @if (result().value; as pin) {
        <dl class="meta" rbResult>
          <div>
            <dt>PIN</dt>
            <dd>{{ pin }}</dd>
          </div>
        </dl>
      }
    </rb-demo-caller>
  `,
  host: { class: 'rb-page rb-page--demo' },
})
export class DemoCallerPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly result = signal<ReturnResult>({
    value: null,
    format: null,
    error: null,
    state: null,
    extras: {},
  });

  ngOnInit(): void {
    this.result.set(parseReturnResult(this.route.snapshot.queryParamMap));
  }

  startPin(): void {
    location.href = buildDemoOpenUrl(appBaseUrl(), {
      delivery: 'hash',
      params: { length: 4 },
    });
  }
}
