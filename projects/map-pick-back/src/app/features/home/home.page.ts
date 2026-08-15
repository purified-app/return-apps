import { Component } from '@angular/core';
import { RbHomeDocs } from 'shared-ui';

@Component({
  selector: 'mp-home-page',
  imports: [RbHomeDocs],
  template: `
    <rb-home-docs
      brand="MapPickBack"
      title="Pick a map point and return it to the app you came from"
      lead="Leaflet map pin picker. Returns value as lat,lng with format=map.point plus zoom."
      ctaLabel="Open map"
      format="map.point"
      [openParamDocs]="['lat', 'lng', 'zoom']"
      demoValue="59.9139,10.7522"
      [returnExtras]="{ lat: '59.9139', lng: '10.7522', zoom: '14' }"
    />
  `,
  host: { class: 'rb-page rb-page--home' },
})
export class HomePage {}
