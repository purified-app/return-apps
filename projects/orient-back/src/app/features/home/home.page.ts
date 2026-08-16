import { Component } from '@angular/core';
import { RbHomeDocs } from 'shared-ui';

@Component({
  selector: 'ob-home-page',
  imports: [RbHomeDocs],
  template: `
    <rb-home-docs
      brand="OrientBack"
      title="Compass, spirit level, and incline — use as a tool or return a reading"
      lead="Live measuring tool with Hold, Copy, and Incline Tare. Modes: compass (heading°), level (pitch,roll), incline (degrees from horizontal)."
      ctaLabel="Open OrientBack"
      format="orient.compass"
      [openParamDocs]="['mode', 'threshold', 'requireLevel']"
      demoValue="42.5"
      [returnExtras]="{ mode: 'compass', heading: '42.5' }"
    />
  `,
  host: { class: 'rb-page rb-page--home' },
})
export class HomePage {}
