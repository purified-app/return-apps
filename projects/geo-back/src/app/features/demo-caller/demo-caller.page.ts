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
  selector: 'gb-demo-caller-page',
  imports: [RbDemoCaller],
  template: `
    <rb-demo-caller
      title="Simulate another app that opens GeoBack"
      lead="Tap “Get location” to open GeoBack. After success, coordinates return here."
      startLabel="Get location"
      [result]="result()"
      (start)="startGeo()"
    >
      @if (result().value) {
        <dl class="meta" rbResult>
          <div>
            <dt>Coords</dt>
            <dd>{{ result().value }}</dd>
          </div>
          @if (result().extras['accuracy']; as accuracy) {
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

  startGeo(): void {
    location.href = buildDemoOpenUrl(appBaseUrl());
  }
}
