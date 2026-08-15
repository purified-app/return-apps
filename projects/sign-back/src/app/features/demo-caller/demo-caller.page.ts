import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  imports: [FormsModule, RbDemoCaller],
  template: `
    <rb-demo-caller
      title="Simulate another app that opens SignBack"
      lead="Tap “Sign” to open the pad. After Done, the signature is returned here (hash delivery)."
      startLabel="Sign"
      [result]="result()"
      (start)="startSign()"
    >
      <label class="field">
        <span>Note (optional)</span>
        <input
          type="text"
          [ngModel]="note()"
          (ngModelChange)="note.set($event)"
          placeholder="Local field unrelated to signature"
        />
      </label>

      @if (result().value; as url) {
        <figure class="preview-wrap" rbResult>
          <img [src]="url" alt="Returned signature" class="preview" />
        </figure>
      }
    </rb-demo-caller>
  `,
  host: { class: 'rb-page rb-page--demo' },
})
export class DemoCallerPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly note = signal('');
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

  startSign(): void {
    location.href = buildDemoOpenUrl(appBaseUrl(), { delivery: 'hash' });
  }
}
