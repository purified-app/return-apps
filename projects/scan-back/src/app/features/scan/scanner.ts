import { Service } from '@angular/core';
import { ScanResult } from '../../core/scan-result.model';

/** Barcode Detector API format names (also used by the WASM ponyfill). */
export type DetectorFormat =
  | 'qr_code'
  | 'ean_13'
  | 'ean_8'
  | 'code_128'
  | 'code_39'
  | 'upc_a'
  | 'upc_e'
  | 'itf'
  | 'data_matrix';

const DEFAULT_FORMATS: DetectorFormat[] = [
  'qr_code',
  'ean_13',
  'ean_8',
  'code_128',
  'code_39',
  'upc_a',
  'upc_e',
  'itf',
  'data_matrix',
];

/** Accept legacy ZXing-style names and Detector API names from `?formats=`. */
const FORMAT_ALIASES: Record<string, DetectorFormat> = {
  QR_CODE: 'qr_code',
  QR: 'qr_code',
  qr_code: 'qr_code',
  EAN_13: 'ean_13',
  ean_13: 'ean_13',
  EAN_8: 'ean_8',
  ean_8: 'ean_8',
  CODE_128: 'code_128',
  code_128: 'code_128',
  CODE_39: 'code_39',
  code_39: 'code_39',
  UPC_A: 'upc_a',
  upc_a: 'upc_a',
  UPC_E: 'upc_e',
  upc_e: 'upc_e',
  ITF: 'itf',
  itf: 'itf',
  DATA_MATRIX: 'data_matrix',
  data_matrix: 'data_matrix',
};

/** Map Detector format → returnUrl `format` value (stable contract). */
const RETURN_FORMAT: Record<string, string> = {
  qr_code: 'QR_CODE',
  ean_13: 'EAN_13',
  ean_8: 'EAN_8',
  code_128: 'CODE_128',
  code_39: 'CODE_39',
  upc_a: 'UPC_A',
  upc_e: 'UPC_E',
  itf: 'ITF',
  data_matrix: 'DATA_MATRIX',
};

const DIGITAL_ZOOM_MIN = 1;
const DIGITAL_ZOOM_MAX = 4;
const SCAN_INTERVAL_MS = 100;
const TARGET_DECODE_WIDTH = 720;

export interface ZoomState {
  min: number;
  max: number;
  value: number;
  mode: 'native' | 'digital';
}

type ZoomCapableTrack = MediaStreamTrack & {
  getCapabilities?: () => MediaTrackCapabilities & {
    zoom?: number | { min: number; max: number; step?: number };
  };
  getSettings?: () => MediaTrackSettings & { zoom?: number };
};

interface BarcodeDetectorLike {
  detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string; format: string }>>;
}

interface BarcodeDetectorCtor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
}

@Service()
export class ScannerService {
  private detector: BarcodeDetectorLike | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private videoTrack: ZoomCapableTrack | null = null;
  private stream: MediaStream | null = null;
  private running = false;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;
  private sampleCanvas: HTMLCanvasElement | null = null;
  private zoomMode: 'native' | 'digital' = 'digital';
  private zoomMin = DIGITAL_ZOOM_MIN;
  private zoomMax = DIGITAL_ZOOM_MAX;
  private zoomValue = DIGITAL_ZOOM_MIN;

  async listVideoDevices(): Promise<MediaDeviceInfo[]> {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return [];
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === 'videoinput');
  }

  parseFormats(formatsParam: string | null): DetectorFormat[] {
    if (!formatsParam?.trim()) {
      return DEFAULT_FORMATS;
    }

    const parsed = formatsParam
      .split(',')
      .map((f) => f.trim())
      .map((name) => FORMAT_ALIASES[name] ?? FORMAT_ALIASES[name.toUpperCase()])
      .filter((f): f is DetectorFormat => f !== undefined);

    return parsed.length > 0 ? [...new Set(parsed)] : DEFAULT_FORMATS;
  }

  getZoomState(): ZoomState {
    return {
      min: this.zoomMin,
      max: this.zoomMax,
      value: this.zoomValue,
      mode: this.zoomMode,
    };
  }

  async setZoom(value: number): Promise<ZoomState> {
    const next = Math.min(this.zoomMax, Math.max(this.zoomMin, value));
    this.zoomValue = next;

    if (this.zoomMode === 'native' && this.videoTrack) {
      try {
        await this.videoTrack.applyConstraints({
          advanced: [{ zoom: next } as MediaTrackConstraintSet],
        });
      } catch {
        this.zoomMode = 'digital';
        this.applyDigitalZoom(next);
      }
    } else {
      this.applyDigitalZoom(next);
    }

    return this.getZoomState();
  }

  async start(
    videoElement: HTMLVideoElement,
    formats: DetectorFormat[],
    deviceId: string | undefined,
    onResult: (result: ScanResult) => void,
  ): Promise<void> {
    await this.stop();

    this.detector = await this.createDetector(formats);
    this.videoElement = videoElement;
    this.sampleCanvas = document.createElement('canvas');

    const constraints: MediaStreamConstraints = {
      audio: false,
      video: deviceId
        ? {
            deviceId: { exact: deviceId },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
          }
        : {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
          },
    };

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = this.stream;
    videoElement.setAttribute('playsinline', 'true');
    videoElement.muted = true;
    await videoElement.play();

    this.videoTrack = this.stream.getVideoTracks()[0] ?? null;
    await this.boostTrackQuality();
    await this.initZoom();

    this.running = true;
    this.scheduleLoop(onResult);
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.loopTimer !== null) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }

    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement.style.transform = '';
    }

    this.videoElement = null;
    this.videoTrack = null;
    this.detector = null;
    this.sampleCanvas = null;
    this.zoomMode = 'digital';
    this.zoomMin = DIGITAL_ZOOM_MIN;
    this.zoomMax = DIGITAL_ZOOM_MAX;
    this.zoomValue = DIGITAL_ZOOM_MIN;
  }

  private scheduleLoop(onResult: (result: ScanResult) => void): void {
    this.loopTimer = setTimeout(() => {
      void this.tick(onResult);
    }, SCAN_INTERVAL_MS);
  }

  private async tick(onResult: (result: ScanResult) => void): Promise<void> {
    if (!this.running) {
      return;
    }

    try {
      const hit = await this.scanOnce();
      if (hit && this.running) {
        onResult(hit);
        return;
      }
    } catch {
      // Keep scanning through transient frame/decode errors.
    }

    if (this.running) {
      this.scheduleLoop(onResult);
    }
  }

  private async scanOnce(): Promise<ScanResult | null> {
    const video = this.videoElement;
    const canvas = this.sampleCanvas;
    const detector = this.detector;
    if (!video || !canvas || !detector || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return null;
    }

    if (!this.drawReticleFrame(video, canvas)) {
      return null;
    }

    // BarcodeDetector returns [] on miss — no throw, no console spam.
    const codes = await detector.detect(canvas);
    const first = codes[0];
    if (!first?.rawValue) {
      return null;
    }

    return {
      scanValue: first.rawValue,
      format: RETURN_FORMAT[first.format] ?? first.format.toUpperCase(),
    };
  }

  /**
   * Sample the visible reticle region (respecting CSS digital zoom) into a
   * bounded canvas so detection matches what the user is aiming at.
   */
  private drawReticleFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): boolean {
    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    if (!sourceWidth || !sourceHeight) {
      return false;
    }

    const zoom = this.zoomMode === 'digital' ? this.zoomValue : 1;
    const visibleWidth = sourceWidth / zoom;
    const visibleHeight = sourceHeight / zoom;
    const sx = (sourceWidth - visibleWidth) / 2;
    const sy = (sourceHeight - visibleHeight) / 2;

    const cropRatio = 0.6;
    const cropWidth = visibleWidth * cropRatio;
    const cropHeight = visibleHeight * cropRatio;
    const cropX = sx + (visibleWidth - cropWidth) / 2;
    const cropY = sy + (visibleHeight - cropHeight) / 2;

    const scale = TARGET_DECODE_WIDTH / Math.max(cropWidth, 1);
    const destWidth = Math.max(1, Math.round(cropWidth * scale));
    const destHeight = Math.max(1, Math.round(cropHeight * scale));

    canvas.width = destWidth;
    canvas.height = destHeight;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return false;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      video,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      destWidth,
      destHeight,
    );
    return true;
  }

  private async createDetector(formats: DetectorFormat[]): Promise<BarcodeDetectorLike> {
    const Native = (globalThis as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
    if (Native) {
      try {
        let formatsToUse: string[] = formats;
        if (typeof Native.getSupportedFormats === 'function') {
          const supported = await Native.getSupportedFormats();
          formatsToUse = formats.filter((name) => supported.includes(name));
        }
        if (formatsToUse.length > 0) {
          return new Native({ formats: formatsToUse });
        }
      } catch {
        // Fall through to WASM ponyfill.
      }
    }

    const { BarcodeDetector, prepareZXingModule } = await import('barcode-detector/ponyfill');
    await prepareZXingModule({
      overrides: {
        locateFile: (path: string, prefix: string) => {
          if (path.endsWith('.wasm')) {
            const base = document.querySelector('base')?.href ?? `${location.origin}/`;
            return new URL(`assets/zxing/${path}`, base).toString();
          }
          return `${prefix}${path}`;
        },
      },
    });
    return new BarcodeDetector({ formats });
  }

  private async boostTrackQuality(): Promise<void> {
    const track = this.videoTrack;
    if (!track) {
      return;
    }

    try {
      await track.applyConstraints({
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
        advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
      });
    } catch {
      try {
        await track.applyConstraints({
          width: { ideal: 1280 },
          height: { ideal: 720 },
        });
      } catch {
        // Keep negotiated settings.
      }
    }
  }

  private async initZoom(): Promise<void> {
    const track = this.videoTrack;
    const caps = track?.getCapabilities?.() as
      | (MediaTrackCapabilities & {
          zoom?: number | { min: number; max: number; step?: number };
        })
      | undefined;
    const zoomCap = caps?.zoom;

    if (zoomCap && typeof zoomCap === 'object' && 'min' in zoomCap && 'max' in zoomCap) {
      this.zoomMode = 'native';
      this.zoomMin = zoomCap.min;
      this.zoomMax = zoomCap.max;
      const settings = track?.getSettings?.() as
        | (MediaTrackSettings & { zoom?: number })
        | undefined;
      this.zoomValue = settings?.zoom ?? zoomCap.min;
      await this.setZoom(this.zoomValue);
      return;
    }

    this.zoomMode = 'digital';
    this.zoomMin = DIGITAL_ZOOM_MIN;
    this.zoomMax = DIGITAL_ZOOM_MAX;
    this.zoomValue = DIGITAL_ZOOM_MIN;
    this.applyDigitalZoom(this.zoomValue);
  }

  private applyDigitalZoom(value: number): void {
    if (!this.videoElement) {
      return;
    }
    this.videoElement.style.transform = value <= 1 ? '' : `scale(${value})`;
  }
}
