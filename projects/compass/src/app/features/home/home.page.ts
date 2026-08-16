import { Component } from '@angular/core';
import { RbHomeDocs } from 'shared-ui';

@Component({
  selector: 'cm-home-page',
  imports: [RbHomeDocs],
  template: `
    <rb-home-docs
      brand="Compass"
      title="Read a heading and return it to the app you came from"
      lead="Live compass with Hold and Copy. Returns heading degrees as value with format=compass.heading."
      ctaLabel="Open Compass"
      format="compass.heading"
      demoValue="42.5"
      [returnExtras]="{ mode: 'compass', heading: '42.5' }"
    />
  `,
  host: { class: 'rb-page rb-page--home' },
})
export class HomePage {}
