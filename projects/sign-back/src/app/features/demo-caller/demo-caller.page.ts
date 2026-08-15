import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RbMetaList, appBaseUrl } from 'shared-ui';

@Component({
  selector: 'sb-demo-caller-page',
  imports: [FormsModule, RbMetaList],
  templateUrl: './demo-caller.page.html',
  host: { class: 'rb-page rb-page--demo' },
})
export class DemoCallerPage implements OnInit {
  private readonly route = inject(ActivatedRoute);

  readonly signature = signal<string | null>(null);
  readonly lastFormat = signal<string | null>(null);
  readonly lastError = signal<string | null>(null);
  readonly lastState = signal<string | null>(null);
  readonly note = signal('');

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const signature = params.get('signature');
    const format = params.get('format');
    const error = params.get('error');
    const state = params.get('state');

    if (signature) {
      this.signature.set(signature);
    }
    if (format) {
      this.lastFormat.set(format);
    }
    if (error) {
      this.lastError.set(error);
    }
    if (state) {
      this.lastState.set(state);
    }
  }

  startSign(): void {
    const base = appBaseUrl();
    const returnUrl = `${base}/demo-caller`;
    location.href = `${base}?returnUrl=${encodeURIComponent(returnUrl)}&state=demo1`;
  }
}
