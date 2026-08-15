import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  RbDemoCaller,
  appBaseUrl,
  buildDemoOpenUrl,
  readReturnParams,
  type ReturnResult,
} from 'shared-ui';

@Component({
  selector: 'sb-demo-caller-page',
  imports: [RbDemoCaller],
  template: `
    <rb-demo-caller
      title="Simulate another app that opens ScanBack"
      lead="Tap “Scan” to open the scanner. After a successful read, the value returns here."
      startLabel="Scan"
      [result]="result()"
      (start)="startScan()"
    />
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
    this.result.set(readReturnParams(this.route.snapshot.queryParamMap));
  }

  startScan(): void {
    location.href = buildDemoOpenUrl(appBaseUrl());
  }
}
