import { Component } from '@angular/core';
import { RbHomeDocs } from 'shared-ui';

@Component({
  selector: 'lv-home-page',
  imports: [RbHomeDocs],
  template: `
    <rb-home-docs
      brand="Level"
      title="Spirit level and incline — use as a tool or return a reading"
      lead="Live measuring tool with Hold, Copy, and Incline Tare. Modes: level (pitch,roll) and incline (degrees from horizontal). Compass is a separate app."
      ctaLabel="Open Level"
      format="level.level"
      [openParams]="{ mode: 'level' }"
      [openParamDocs]="['threshold', 'requireLevel']"
      demoValue="0.4,-0.2"
      [returnExtras]="{ mode: 'level', pitch: '0.4', roll: '-0.2' }"
    />
  `,
  host: { class: 'rb-page rb-page--home' },
})
export class HomePage {}
