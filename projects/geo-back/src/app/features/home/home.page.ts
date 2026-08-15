import { Component } from '@angular/core';
import { RbHomeDocs } from 'shared-ui';

@Component({
  selector: 'gb-home-page',
  imports: [RbHomeDocs],
  template: `
    <rb-home-docs
      brand="GeoBack"
      title="Capture GPS coordinates and return them to the app you came from"
      lead="Geolocation helper. Returns value as lat,lng with format=geo.point plus accuracy/timestamp extras."
      ctaLabel="Get location"
      format="geo.point"
      [openParamDocs]="['highAccuracy']"
      demoValue="59.9139,10.7522"
      [returnExtras]="{ lat: '59.9139', lng: '10.7522', accuracy: '12.5', timestamp: '0' }"
    />
  `,
  host: { class: 'rb-page rb-page--home' },
})
export class HomePage {}
