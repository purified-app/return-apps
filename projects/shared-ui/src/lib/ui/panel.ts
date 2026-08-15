import { Component, input } from '@angular/core';

/** Standard result / error panel used by return helper flows. */
@Component({
  selector: 'rb-panel',
  template: `
    <section class="panel">
      <h1>{{ title() }}</h1>
      <ng-content />
    </section>
  `,
})
export class RbPanel {
  readonly title = input.required<string>();
}
