import { Component } from '@angular/core';
import { RbHomeDocs, appBaseUrl, buildDemoOpenUrl } from 'shared-ui';

@Component({
  selector: 'mp-home-page',
  imports: [RbHomeDocs],
  template: `
    <rb-home-docs
      brand="MapPickBack"
      title="Pick a map point and return it to the app you came from"
      lead="Leaflet map pin picker. After Done, the point is returned as value (lat,lng) with zoom (query by default)."
      ctaLabel="Open map"
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
    '?returnUrl=<url>&state=<optional>&allowedOrigins=<optional>&lat=&lng=&zoom=';
  readonly returnExample =
    '<returnUrl>?value=<lat>,<lng>&format=map.point&lat=&lng=&zoom=&state=<state>';
  readonly demoOpenUrl: string;
  readonly demoReturnUrl: string;

  constructor() {
    const base = appBaseUrl();
    this.demoOpenUrl = buildDemoOpenUrl(base);
    this.demoReturnUrl = `${base}/demo-caller?value=59.9139,10.7522&format=map.point&lat=59.9139&lng=10.7522&zoom=14&state=demo1`;
  }
}
