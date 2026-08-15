import { Component, input, output } from '@angular/core';
import type { ReturnResult } from '../core/return-helpers';
import { RbMetaList } from './meta-list';

/**
 * Shared demo-caller chrome. Project optional fields above the start button
 * and result UI via `[rbResult]`; meta list is always shown.
 */
@Component({
  selector: 'rb-demo-caller',
  imports: [RbMetaList],
  template: `
    <main class="demo">
      <header>
        <p class="brand">Demo caller</p>
        <h1>{{ title() }}</h1>
        <p class="lead">{{ lead() }}</p>
      </header>

      <ng-content />

      <button type="button" class="btn" (click)="start.emit()">{{ startLabel() }}</button>

      <ng-content select="[rbResult]" />

      <rb-meta-list
        [value]="result().value"
        [format]="result().format"
        [state]="result().state"
        [error]="result().error"
      />
    </main>
  `,
})
export class RbDemoCaller {
  readonly title = input.required<string>();
  readonly lead = input.required<string>();
  readonly startLabel = input.required<string>();
  readonly result = input.required<ReturnResult>();
  readonly start = output<void>();
}
