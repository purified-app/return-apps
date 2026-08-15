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
  selector: 'cb-demo-caller-page',
  imports: [RbDemoCaller],
  template: `
    <rb-demo-caller
      title="Simulate another app that opens ColorBack"
      lead="Tap “Pick color” to open the eyedropper. After Use color, the value returns here."
      startLabel="Pick color"
      [result]="result()"
      (start)="startColor()"
    >
      @if (result().value; as hex) {
        <div class="swatch-row" rbResult>
          <span class="swatch" [style.background]="hex" aria-hidden="true"></span>
          <dl class="meta">
            <div>
              <dt>Hex</dt>
              <dd>{{ hex }}</dd>
            </div>
            @if (result().extras['rgb']; as rgb) {
              <div>
                <dt>RGB</dt>
                <dd>{{ rgb }}</dd>
              </div>
            }
          </dl>
        </div>
      }
    </rb-demo-caller>
  `,
  styleUrl: './demo-caller.page.css',
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

  startColor(): void {
    location.href = buildDemoOpenUrl(appBaseUrl());
  }
}
