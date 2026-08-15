import { Directive, input } from '@angular/core';

export type RbPageVariant = 'home' | 'demo' | 'plain';

/**
 * Applies shared page-shell host classes.
 * Prefer hostDirectives on routed pages:
 * `hostDirectives: [{ directive: RbPage, inputs: ['rbPage'] }]`
 * with a fixed `rbPage` input default, or set `host.class` directly.
 */
@Directive({
  selector: '[rbPage]',
  host: {
    class: 'rb-page',
    '[class.rb-page--home]': 'rbPage() === "home"',
    '[class.rb-page--demo]': 'rbPage() === "demo"',
    '[class.rb-page--plain]': 'rbPage() === "plain"',
  },
})
export class RbPage {
  readonly rbPage = input<RbPageVariant>('plain');
}
