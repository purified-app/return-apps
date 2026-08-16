import { Component, input } from '@angular/core';

/** Displays optional value / format / state / error rows returned from a helper app. */
@Component({
  selector: 'rb-meta-list',
  template: `
    @if (value() || format() || state() || error()) {
      <dl class="meta">
        @if (value(); as v) {
          <div>
            <dt>Value</dt>
            <dd class="meta__value">{{ v }}</dd>
          </div>
        }
        @if (format(); as v) {
          <div>
            <dt>Format</dt>
            <dd>{{ v }}</dd>
          </div>
        }
        @if (state(); as v) {
          <div>
            <dt>State</dt>
            <dd>{{ v }}</dd>
          </div>
        }
        @if (error(); as v) {
          <div>
            <dt>Error</dt>
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
