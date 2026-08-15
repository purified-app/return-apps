import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RbMetaList, appBaseUrl } from 'shared-ui';

@Component({
  selector: 'pb-demo-caller-page',
  imports: [RbMetaList],
  templateUrl: './demo-caller.page.html',
  host: { class: 'rb-page rb-page--demo' },
})
export class DemoCallerPage implements OnInit {
  private readonly route = inject(ActivatedRoute);

  readonly pin = signal<string | null>(null);
  readonly lastFormat = signal<string | null>(null);
  readonly lastError = signal<string | null>(null);
  readonly lastState = signal<string | null>(null);

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.pin.set(params.get('pin'));
    this.lastFormat.set(params.get('format'));
    this.lastError.set(params.get('error'));
    this.lastState.set(params.get('state'));
  }

  startPin(): void {
    const base = appBaseUrl();
    const returnUrl = `${base}/demo-caller`;
    location.href = `${base}/pin?returnUrl=${encodeURIComponent(returnUrl)}&state=demo1&length=4`;
  }
}
