import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RbDemoCaller } from 'shared-ui';

@Component({
  selector: 'sb-demo-caller-page',
  imports: [FormsModule, RbDemoCaller],
  template: `
    <rb-demo-caller
      #demo
      title="Simulate another app that opens SignBack"
      lead="Tap “Sign” to open the pad. After Done, the signature is returned here (hash delivery)."
      startLabel="Sign"
      delivery="hash"
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

      @if (demo.result().value; as url) {
        <figure class="preview-wrap" rbResult>
          <img [src]="url" alt="Returned signature" class="preview" />
        </figure>
      }
    </rb-demo-caller>
  `,
  host: { class: 'rb-page rb-page--demo' },
})
export class DemoCallerPage {
  readonly note = signal('');
}
