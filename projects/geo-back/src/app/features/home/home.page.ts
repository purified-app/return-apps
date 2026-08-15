import { Component } from '@angular/core';
import { RbHomeDocs, appBaseUrl, buildDemoOpenUrl } from 'shared-ui';

@Component({
  selector: 'gb-home-page',
  imports: [RbHomeDocs],
  template: `
    <rb-home-docs
      brand="GeoBack"
      title="Capture GPS coordinates and return them to the app you came from"
      lead="Mobile-first geolocation helper. After a successful reading, coordinates are returned as value (lat,lng) plus extras."
      ctaLabel="Get location"
      [openExample]="openExample"
      [returnExample]="returnExample"
      [demoOpenUrl]="demoOpenUrl"
      [demoReturnUrl]="demoReturnUrl"
    />
  `,
  host: { class: 'rb-page rb-page--home' },
})
export class HomePage {
  readonly openExample =
    '?returnUrl=<urlencoded-https-url>&state=<optional>&allowedOrigins=<optional>&highAccuracy=<optional>';
  readonly returnExample =
    '<returnUrl>?value=<lat>,<lng>&format=geo.point&lat=&lng=&accuracy=&timestamp=&state=<state>';
  readonly demoOpenUrl: string;
  readonly demoReturnUrl: string;

  constructor() {
    const base = appBaseUrl();
    this.demoOpenUrl = buildDemoOpenUrl(base);
    this.demoReturnUrl = `${base}/demo-caller?value=59.9139,10.7522&format=geo.point&lat=59.9139&lng=10.7522&accuracy=12.5&timestamp=0&state=demo1`;
  }
}
