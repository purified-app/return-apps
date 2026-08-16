import { Component, input, signal } from '@angular/core';
import {
  copyText,
  downloadBlob,
  downloadDataUrl,
  downloadText,
  type ResultDownload,
} from '../core/result-actions';

/** Shared Copy / Download action row for standalone (no returnUrl) results. */
@Component({
  selector: 'rb-result-actions',
  template: `
    <div class="actions">
      @if (copyValue(); as text) {
        <button type="button" class="btn" (click)="onCopy(text)">
          {{ copied() ? 'Copied!' : copyLabel() }}
        </button>
      }
      @for (file of downloads(); track file.filename + file.label) {
        <button type="button" class="btn" (click)="onDownload(file)" [disabled]="busy()">
          {{ file.label }}
        </button>
      }
      <ng-content />
    </div>
    @if (error(); as message) {
      <p class="error" role="alert">{{ message }}</p>
    }
  `,
})
export class RbResultActions {
  /** Text to copy when the Copy button is pressed. Omit to hide Copy. */
  readonly copyValue = input<string | null>(null);
  readonly copyLabel = input('Copy');
  /** Optional file downloads (SVG, PNG, text, …). */
  readonly downloads = input<readonly ResultDownload[]>([]);

  readonly copied = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  async onCopy(text: string): Promise<void> {
    this.error.set(null);
    const ok = await copyText(text);
    this.copied.set(ok);
    if (!ok) {
      this.error.set('Could not copy to clipboard.');
    }
  }

  async onDownload(file: ResultDownload): Promise<void> {
    this.error.set(null);
    this.busy.set(true);
    try {
      if (file.kind === 'dataUrl') {
        downloadDataUrl(file.dataUrl, file.filename);
        return;
      }
      if (file.kind === 'text') {
        downloadText(file.text, file.filename, file.mimeType);
        return;
      }
      const blob = await file.getBlob();
      downloadBlob(blob, file.filename);
    } catch {
      this.error.set(`Could not download ${file.filename}.`);
    } finally {
      this.busy.set(false);
    }
  }
}
