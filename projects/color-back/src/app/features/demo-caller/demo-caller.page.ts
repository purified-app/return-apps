import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RbMetaList, appBaseUrl } from 'shared-ui';

@Component({
  selector: 'cb-demo-caller-page',
  imports: [RbMetaList],
  templateUrl: './demo-caller.page.html',
  styleUrl: './demo-caller.page.css',
  host: { class: 'rb-page rb-page--demo' },
})
export class DemoCallerPage implements OnInit {
  private readonly route = inject(ActivatedRoute);

  readonly hex = signal<string | null>(null);
  readonly rgb = signal<string | null>(null);
  readonly lastFormat = signal<string | null>(null);
  readonly lastError = signal<string | null>(null);
  readonly lastState = signal<string | null>(null);

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.hex.set(params.get('hex'));
    this.rgb.set(params.get('rgb'));
    this.lastFormat.set(params.get('format'));
    this.lastError.set(params.get('error'));
    this.lastState.set(params.get('state'));
  }

  startColor(): void {
    const base = appBaseUrl();
    const returnUrl = `${base}/demo-caller`;
    location.href = `${base}/color?returnUrl=${encodeURIComponent(returnUrl)}&state=demo1`;
  }
}
