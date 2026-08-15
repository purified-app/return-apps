import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RETURN_CONTRACT_VERSION } from '../core/return-contract';

/** Shared home/docs shell used by every return helper app. */
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
        <h2>Integration</h2>
        <p>Contract v{{ contractVersion }} — open the app:</p>
        <pre><code>{{ openExample() }}</code></pre>
        <p>After success, return:</p>
        <pre><code>{{ returnExample() }}</code></pre>

        <h3>Demo URL example</h3>
        <p>Open {{ brand() }} and return to the built-in demo caller:</p>
        <pre><code>{{ demoOpenUrl() }}</code></pre>
        <p>Example return shape:</p>
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
  readonly openExample = input.required<string>();
  readonly returnExample = input.required<string>();
  readonly demoOpenUrl = input.required<string>();
  readonly demoReturnUrl = input.required<string>();
  readonly footnote = input(
    'Without returnUrl, the result stays in the app (standalone mode). Pass allowedOrigins to restrict returnUrl. Sensitive apps default to delivery=hash.',
  );

  readonly contractVersion = RETURN_CONTRACT_VERSION;
}
