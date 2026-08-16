import { Component, OnInit, inject, input, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@angular-libs/translate';
import { appBaseUrl } from '../core/app-base-url';
import {
  buildDemoOpenUrl,
  readReturnParams,
  type ReturnResult,
} from '../core/return-helpers';
import type { ReturnDelivery } from '../core/return-url.validator';
import { RbMetaList } from './meta-list';

/**
 * Shared demo-caller chrome.
 * Reads return params automatically; start navigates via buildDemoOpenUrl.
 * Use `#demo` + `demo.result()` in projected content when you need a custom preview.
 */
@Component({
  selector: 'rb-demo-caller',
  imports: [RbMetaList, TranslatePipe],
  template: `
    <main class="demo">
      <header>
        <p class="brand">{{ 'demo.brand' | translate }}</p>
        <h1>{{ title() }}</h1>
        <p class="lead">{{ lead() }}</p>
      </header>

      <ng-content />

      <button type="button" class="btn" (click)="start()">{{ startLabel() }}</button>

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
export class RbDemoCaller implements OnInit {
  private readonly route = inject(ActivatedRoute);

  readonly title = input.required<string>();
  readonly lead = input.required<string>();
  readonly startLabel = input.required<string>();
  readonly delivery = input<ReturnDelivery>('query');
  readonly params = input<Record<string, string | number | boolean>>({});

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

  start(): void {
    location.href = buildDemoOpenUrl(appBaseUrl(), {
      delivery: this.delivery(),
      params: this.params(),
    });
  }
}
