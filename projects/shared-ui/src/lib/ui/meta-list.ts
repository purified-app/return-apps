import { Component, input } from '@angular/core';
import { TranslatePipe } from '@angular-libs/translate';

/** Displays optional value / format / state / error rows returned from a helper app. */
@Component({
  selector: 'rb-meta-list',
  imports: [TranslatePipe],
  template: `
    @if (value() || format() || state() || error()) {
      <dl class="meta">
        @if (value(); as v) {
          <div>
            <dt>{{ 'common.value' | translate }}</dt>
            <dd class="meta__value">{{ v }}</dd>
          </div>
        }
        @if (format(); as v) {
          <div>
            <dt>{{ 'common.format' | translate }}</dt>
            <dd>{{ v }}</dd>
          </div>
        }
        @if (state(); as v) {
          <div>
            <dt>{{ 'common.state' | translate }}</dt>
            <dd>{{ v }}</dd>
          </div>
        }
        @if (error(); as v) {
          <div>
            <dt>{{ 'common.error' | translate }}</dt>
            <dd>{{ v }}</dd>
          </div>
        }
      </dl>
    }
  `,
})
export class RbMetaList {
  readonly value = input<string | null>(null);
  readonly format = input<string | null>(null);
  readonly state = input<string | null>(null);
  readonly error = input<string | null>(null);
}
