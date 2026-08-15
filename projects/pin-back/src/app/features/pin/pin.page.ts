import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReturnSession, ReturnUrlValidator, RbPanel } from 'shared-ui';

type PinStatus = 'ready' | 'invalid-return-url' | 'incomplete' | 'done' | 'redirecting';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'] as const;

@Component({
  selector: 'pb-pin-page',
  imports: [RouterLink, RbPanel],
  templateUrl: './pin.page.html',
  styleUrl: './pin.page.css',
  host: { class: 'rb-page rb-page--plain' },
})
export class PinPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly returnUrlValidator = inject(ReturnUrlValidator);

  readonly keys = KEYS;
  readonly status = signal<PinStatus>('ready');
  readonly errorDetail = signal<string | null>(null);
  readonly digits = signal('');
  readonly mask = signal(true);
  readonly length = signal(4);

  readonly display = computed(() => {
    const value = this.digits();
    if (!this.mask()) {
      return value.padEnd(this.length(), '·');
    }
    return '•'.repeat(value.length).padEnd(this.length(), '·');
  });

  private session!: ReturnSession;

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;

    const lengthParam = Number(params.get('length'));
    if (Number.isFinite(lengthParam) && lengthParam >= 3 && lengthParam <= 12) {
      this.length.set(Math.floor(lengthParam));
    }

    const maskParam = params.get('mask');
    if (maskParam === '0' || maskParam === 'false') {
      this.mask.set(false);
    }

    const init = ReturnSession.open(this.returnUrlValidator, params, { delivery: 'hash' });
    this.session = init.session;
    if (!init.ok) {
      this.status.set('invalid-return-url');
      this.errorDetail.set(init.reason);
    }
  }

  onKey(key: string): void {
    if (key === '') {
      return;
    }
    if (key === 'back') {
      this.digits.update((value) => value.slice(0, -1));
      if (this.status() === 'incomplete') {
        this.status.set('ready');
        this.errorDetail.set(null);
      }
      return;
    }
    if (this.digits().length >= this.length()) {
      return;
    }
    this.digits.update((value) => value + key);
    if (this.status() === 'incomplete') {
      this.status.set('ready');
      this.errorDetail.set(null);
    }
  }

  onClear(): void {
    this.digits.set('');
    this.status.set('ready');
    this.errorDetail.set(null);
  }

  onCancel(): void {
    if (this.session.cancel()) {
      return;
    }
    if (history.length > 1) {
      history.back();
      return;
    }
    void this.router.navigateByUrl('/home');
  }

  onDone(): void {
    const pin = this.digits();
    if (pin.length !== this.length()) {
      this.status.set('incomplete');
      this.errorDetail.set(`Enter ${this.length()} digits.`);
      return;
    }

    if (this.session.succeed(pin, 'pin.digits')) {
      this.status.set('redirecting');
      return;
    }

    this.status.set('done');
  }
}
