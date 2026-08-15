import { Component, input } from '@angular/core';

/** Displays optional format / state / error rows returned from a helper app. */
@Component({
  selector: 'rb-meta-list',
  template: `
    @if (format() || state() || error()) {
      <dl class="meta">
        @if (format(); as value) {
          <div>
            <dt>Format</dt>
            <dd>{{ value }}</dd>
          </div>
        }
        @if (state(); as value) {
          <div>
            <dt>State</dt>
            <dd>{{ value }}</dd>
          </div>
        }
        @if (error(); as value) {
          <div>
            <dt>Error</dt>
            <dd>{{ value }}</dd>
          </div>
        }
      </dl>
    }
  `,
})
export class RbMetaList {
  readonly format = input<string | null>(null);
  readonly state = input<string | null>(null);
  readonly error = input<string | null>(null);
}
