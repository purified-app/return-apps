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
  selector: 'nb-demo-caller-page',
  imports: [RbDemoCaller],
  template: `
    <rb-demo-caller
      title="Simulate another app that opens NfcBack"
      lead="Tap “Scan NFC” to open the reader. After a successful read, the value returns here."
      startLabel="Scan NFC"
      [result]="result()"
      (start)="startNfc()"
    >
      @if (result().value) {
        <dl class="meta" rbResult>
          <div>
            <dt>NFC</dt>
            <dd>{{ result().value }}</dd>
          </div>
          @if (result().extras['recordType']; as recordType) {
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

  startNfc(): void {
    location.href = buildDemoOpenUrl(appBaseUrl());
  }
}
