import { Component } from '@angular/core';
import { RbDemoCaller } from 'shared-ui';

@Component({
  selector: 'mp-demo-caller-page',
  imports: [RbDemoCaller],
  template: `
    <rb-demo-caller
      #demo
      title="Simulate another app that opens MapPickBack"
      lead="Tap “Open map” to pick a point, measure a path, or draw an area. The result returns here."
      startLabel="Open map"
    >
      @if (demo.result().value) {
        <dl class="meta" rbResult>
          <div>
            <dt>Value</dt>
            <dd>{{ demo.result().value }}</dd>
          </div>
          @if (demo.result().format; as format) {
            <div>
              <dt>Format</dt>
              <dd>{{ format }}</dd>
            </div>
          }
          @if (demo.result().extras['mode']; as mode) {
            <div>
              <dt>Mode</dt>
              <dd>{{ mode }}</dd>
            </div>
          }
          @if (demo.result().extras['zoom']; as zoom) {
            <div>
              <dt>Zoom</dt>
              <dd>{{ zoom }}</dd>
            </div>
          }
          @if (demo.result().extras['meters']; as meters) {
            <div>
              <dt>Meters</dt>
              <dd>{{ meters }}</dd>
            </div>
          }
          @if (demo.result().extras['squareMeters']; as sq) {
            <div>
              <dt>Square meters</dt>
              <dd>{{ sq }}</dd>
            </div>
          }
          @if (demo.result().extras['points']; as points) {
            <div>
              <dt>Points</dt>
              <dd>{{ points }}</dd>
            </div>
          }
        </dl>
      }
    </rb-demo-caller>
  `,
  host: { class: 'rb-page rb-page--demo' },
})
export class DemoCallerPage {}
