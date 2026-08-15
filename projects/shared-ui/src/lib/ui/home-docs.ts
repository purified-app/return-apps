import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { appBaseUrl } from '../core/app-base-url';
import {
  RETURN_CONTRACT_VERSION,
  buildDemoOpenUrl,
} from '../core/return-helpers';
import type { ReturnDelivery } from '../core/return-url.validator';

/** Shared home/docs shell — builds open/return/demo examples from format + delivery. */
@Component({
  selector: 'rb-home-docs',
  imports: [RouterLink],
  template: `
    <main class="home">
      <header>
        <p class="brand">{{ brand() }}</p>
        <h1>{{ title() }}</h1>
        <p class="lead">{{ lead() }}</p>
        <div class="cta">
          <a routerLink="/" class="btn">{{ ctaLabel() }}</a>
          <a routerLink="/demo-caller" class="btn btn-ghost">Try demo caller</a>
        </div>
      </header>

      <section class="docs">
        <h2>Integration (v{{ contractVersion }})</h2>
        <p>Open:</p>
        <pre><code>{{ openExample() }}</code></pre>
        <p>Return:</p>
        <pre><code>{{ returnExample() }}</code></pre>
        <h3>Demo</h3>
        <pre><code>{{ demoOpenUrl() }}</code></pre>
        <pre><code>{{ demoReturnUrl() }}</code></pre>
        <p>{{ footnote() }}</p>
      </section>
    </main>
  `,
})
export class RbHomeDocs {
  readonly brand = input.required<string>();
  readonly title = input.required<string>();
  readonly lead = input.required<string>();
  readonly ctaLabel = input.required<string>();
  /** Canonical format tag, e.g. pin.digits / sign.svg / scan.qr_code */
  readonly format = input.required<string>();
  readonly delivery = input<ReturnDelivery>('query');
  /** Extra open query params used for the live demo URL (and listed in open docs). */
  readonly openParams = input<Record<string, string | number | boolean>>({});
  /** Extra open param names to document only (not sent in demo), e.g. ['formats', 'mask']. */
  readonly openParamDocs = input<string[]>([]);
  /** Sample value shown in return docs / demo return URL. */
  readonly demoValue = input('…');
  /** Extra return params for the demo return example (lat, rgb, …). */
  readonly returnExtras = input<Record<string, string>>({});
  readonly footnote = input(
    'Pass allowedOrigins to restrict returnUrl. Pin/sign default to delivery=hash — parse the fragment or use the SDK. Full guide: docs/integration.md',
  );

  readonly contractVersion = RETURN_CONTRACT_VERSION;

  readonly openExample = computed(() => {
    const parts = [
      'returnUrl=<url>',
      'state=<optional>',
      'allowedOrigins=<optional>',
      `delivery=${this.delivery()}`,
    ];
    for (const key of Object.keys(this.openParams())) {
      parts.push(`${key}=<optional>`);
    }
    for (const key of this.openParamDocs()) {
      if (!parts.some((p) => p.startsWith(`${key}=`))) {
        parts.push(`${key}=<optional>`);
      }
    }
    return `?${parts.join('&')}`;
  });

  readonly returnExample = computed(() => {
    const extras = Object.entries(this.returnExtras())
      .map(([k, v]) => `&${k}=${v}`)
      .join('');
    const body = `value=<payload>&format=${this.format()}&state=<state>${extras}`;
    return this.delivery() === 'hash' ? `<returnUrl>#${body}` : `<returnUrl>?${body}`;
  });

  readonly demoOpenUrl = computed(() =>
    buildDemoOpenUrl(appBaseUrl(), {
      delivery: this.delivery(),
      params: this.openParams(),
    }),
  );

  readonly demoReturnUrl = computed(() => {
    const base = `${appBaseUrl().replace(/\/$/, '')}/demo-caller`;
    const params = new URLSearchParams({
      value: this.demoValue(),
      format: this.format(),
      state: 'demo1',
      ...this.returnExtras(),
    });
    const qs = params.toString();
    return this.delivery() === 'hash' ? `${base}#${qs}` : `${base}?${qs}`;
  });
}
