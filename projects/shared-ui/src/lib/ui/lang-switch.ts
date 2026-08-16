import { Component, inject } from '@angular/core';
import { ALTranslate, TranslatePipe } from '@angular-libs/translate';
import { persistReturnAppsLang, type ReturnAppsLang } from '../i18n/provide-return-i18n';

@Component({
  selector: 'rb-lang-switch',
  imports: [TranslatePipe],
  template: `
    @if (translate; as t) {
      <div class="lang" role="group" [attr.aria-label]="'common.language' | translate">
        <button
          type="button"
          class="lang-btn"
          [class.lang-btn--on]="t.currentLang() === 'en'"
          (click)="set('en')"
        >
          EN
        </button>
        <button
          type="button"
          class="lang-btn"
          [class.lang-btn--on]="t.currentLang() === 'nb'"
          (click)="set('nb')"
        >
          NB
        </button>
      </div>
    }
  `,
  styles: `
    .lang {
      position: sticky;
      top: 0;
      z-index: 30;
      display: flex;
      justify-content: flex-end;
      gap: 0.25rem;
      padding: 0.45rem max(0.75rem, env(safe-area-inset-right)) 0
        max(0.75rem, env(safe-area-inset-left));
    }
    .lang-btn {
      appearance: none;
      border: 1px solid rgb(255 255 255 / 16%);
      border-radius: 999px;
      min-height: 2rem;
      min-width: 2.4rem;
      padding: 0.2rem 0.55rem;
      background: rgb(15 20 24 / 55%);
      color: var(--rb-muted, #b7c2cc);
      font: inherit;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      cursor: pointer;
    }
    .lang-btn--on {
      background: var(--rb-fg, #eef2f5);
      color: var(--rb-bg, #0f1418);
      border-color: transparent;
    }
    .lang-btn:focus-visible {
      outline: 2px solid var(--rb-fg, #eef2f5);
      outline-offset: 2px;
    }
  `,
})
export class RbLangSwitch {
  readonly translate = inject(ALTranslate, { optional: true });

  async set(next: ReturnAppsLang): Promise<void> {
    if (!this.translate || this.translate.currentLang() === next) {
      return;
    }
    persistReturnAppsLang(next);
    await this.translate.loadLanguage(next);
  }
}
