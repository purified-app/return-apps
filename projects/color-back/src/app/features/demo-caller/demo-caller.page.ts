import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RbMetaList, appBaseUrl, readReturnParams } from 'shared-ui';

@Component({
  selector: 'cb-demo-caller-page',
  imports: [RbMetaList],
  templateUrl: './demo-caller.page.html',
  styleUrl: './demo-caller.page.css',
  host: { class: 'rb-page rb-page--demo' },
})
export class DemoCallerPage implements OnInit {
  private readonly route = inject(ActivatedRoute);

  readonly value = signal<string | null>(null);
  readonly lastFormat = signal<string | null>(null);
  readonly lastError = signal<string | null>(null);
  readonly lastState = signal<string | null>(null);
  readonly rgb = signal<string | null>(null);

  ngOnInit(): void {
    const result = readReturnParams(this.route.snapshot.queryParamMap);
    this.value.set(result.value);
    this.lastFormat.set(result.format);
    this.lastError.set(result.error);
    this.lastState.set(result.state);
    this.rgb.set(this.route.snapshot.queryParamMap.get('rgb'));
  }

  startColor(): void {
    const base = appBaseUrl();
    const returnUrl = `${base}/demo-caller`;
    const origin = new URL(base).origin;
    location.href = `${base}?returnUrl=${encodeURIComponent(returnUrl)}&state=demo1&allowedOrigins=${encodeURIComponent(origin)}`;
  }
}
