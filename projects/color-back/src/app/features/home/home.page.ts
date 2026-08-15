import { Component } from '@angular/core';
import { RbHomeDocs, appBaseUrl, buildDemoOpenUrl } from 'shared-ui';

@Component({
  selector: 'cb-home-page',
  imports: [RbHomeDocs],
  template: `
    <rb-home-docs
      brand="ColorBack"
      title="Sample a color and return it to the app you came from"
      lead="Camera eyedropper. After Use color, the hex value is returned with an rgb extra."
      ctaLabel="Open eyedropper"
      [openExample]="openExample"
      [returnExample]="returnExample"
      [demoOpenUrl]="demoOpenUrl"
      [demoReturnUrl]="demoReturnUrl"
      footnote="Requires camera permission and HTTPS (or localhost). Without returnUrl, the color stays in the app."
    />
  `,
  host: { class: 'rb-page rb-page--home' },
})
export class HomePage {
  readonly openExample =
    '?returnUrl=<urlencoded-https-url>&state=<optional>&allowedOrigins=<optional>';
  readonly returnExample = '<returnUrl>?value=#rrggbb&format=color.hex&rgb=r,g,b&state=<state>';
  readonly demoOpenUrl: string;
  readonly demoReturnUrl: string;

  constructor() {
    const base = appBaseUrl();
    this.demoOpenUrl = buildDemoOpenUrl(base);
    this.demoReturnUrl = `${base}/demo-caller?value=%23c45c26&format=color.hex&rgb=196,92,38&state=demo1`;
  }
}
