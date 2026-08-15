import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

function appBaseUrl(): string {
  const baseHref = document.querySelector('base')?.href ?? `${location.origin}/`;
  return baseHref.replace(/\/$/, '');
}

@Component({
  selector: 'sb-home-page',
  imports: [RouterLink],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  readonly demoOpenUrl: string;
  readonly demoReturnUrl: string;

  constructor() {
    const base = appBaseUrl();
    const returnUrl = `${base}/demo-caller`;
    this.demoOpenUrl = `${base}/sign?returnUrl=${encodeURIComponent(returnUrl)}&state=demo1`;
    this.demoReturnUrl = `${base}/demo-caller?signature=<svg-data-url>&format=image/svg+xml&state=demo1`;
  }
}
