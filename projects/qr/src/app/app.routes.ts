import { Routes } from '@angular/router';
import { QrPage } from './features/qr/qr.page';

export const routes: Routes = [
  { path: '', component: QrPage },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'demo-caller',
    loadComponent: () =>
      import('./features/demo-caller/demo-caller.page').then((m) => m.DemoCallerPage),
  },
  { path: 'qr', redirectTo: '' },
  { path: '**', redirectTo: '' },
];
