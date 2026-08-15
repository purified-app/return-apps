import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  RbDemoCaller,
  appBaseUrl,
  buildDemoOpenUrl,
  parseReturnResult,
  type ReturnResult,
} from 'shared-ui';

@Component({
  selector: 'sb-demo-caller-page',
  imports: [FormsModule, RbDemoCaller],
  template: `
    <rb-demo-caller
      title="Simulate another app that opens ScanBack"
      lead="Tap “Scan” to open the scanner. After a successful read, the value returns here."
      startLabel="Scan"
      [result]="result()"
      (start)="startScan()"
    >
      @if (result().value; as scanned) {
        <label class="field" rbResult>
          <span>Value</span>
          <input type="text" [ngModel]="scanned" readonly />
        </label>
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

  startScan(): void {
    location.href = buildDemoOpenUrl(appBaseUrl());
  }
}
