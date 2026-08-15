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
  selector: 'mp-demo-caller-page',
  imports: [RbDemoCaller],
  template: `
    <rb-demo-caller
      title="Simulate another app that opens MapPickBack"
      lead="Tap “Pick on map” to open the map. After Done, the pin returns here."
      startLabel="Pick on map"
      [result]="result()"
      (start)="startMap()"
    >
      @if (result().value) {
        <dl class="meta" rbResult>
          <div>
            <dt>Point</dt>
            <dd>{{ result().value }}</dd>
          </div>
          @if (result().extras['zoom']; as zoom) {
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

  startMap(): void {
    location.href = buildDemoOpenUrl(appBaseUrl());
  }
}
