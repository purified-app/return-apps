import { Component } from '@angular/core';
import { RbHomeDocs } from 'shared-ui';

@Component({
  selector: 'mp-home-page',
  imports: [RbHomeDocs],
  template: `
    <rb-home-docs
      brand="MapPickBack"
      title="Pick a point, measure a path, or draw an area on the map"
      lead="Leaflet map with Pick / Measure / Area tabs. Returns map.point, map.distance (meters), or map.area (m²)."
      ctaLabel="Open map"
      format="map.point"
      [openParamDocs]="['lat', 'lng', 'zoom', 'mode', 'units']"
      demoValue="59.9139,10.7522"
      [returnExtras]="{ lat: '59.9139', lng: '10.7522', zoom: '14' }"
    />
  `,
  host: { class: 'rb-page rb-page--home' },
})
export class HomePage {}
