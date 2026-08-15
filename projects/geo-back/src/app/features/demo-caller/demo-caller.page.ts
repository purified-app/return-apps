import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RbMetaList, appBaseUrl } from 'shared-ui';

@Component({
  selector: 'gb-demo-caller-page',
  imports: [RbMetaList],
  templateUrl: './demo-caller.page.html',
  host: { class: 'rb-page rb-page--demo' },
})
export class DemoCallerPage implements OnInit {
  private readonly route = inject(ActivatedRoute);

  readonly lat = signal<string | null>(null);
  readonly lng = signal<string | null>(null);
  readonly accuracy = signal<string | null>(null);
  readonly lastFormat = signal<string | null>(null);
  readonly lastError = signal<string | null>(null);
  readonly lastState = signal<string | null>(null);

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.lat.set(params.get('lat'));
    this.lng.set(params.get('lng'));
    this.accuracy.set(params.get('accuracy'));
    this.lastFormat.set(params.get('format'));
    this.lastError.set(params.get('error'));
    this.lastState.set(params.get('state'));
  }

  startGeo(): void {
    const base = appBaseUrl();
    const returnUrl = `${base}/demo-caller`;
    location.href = `${base}?returnUrl=${encodeURIComponent(returnUrl)}&state=demo1`;
  }
}
