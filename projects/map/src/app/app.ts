import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RbLangSwitch } from 'shared-ui';

@Component({
  selector: 'mp-root',
  imports: [RouterOutlet, RbLangSwitch],
  template: `<rb-lang-switch /><router-outlet />`,
  styles: `
    :host {
      display: block;
      min-height: 100dvh;
    }
  `,
})
export class App {}
