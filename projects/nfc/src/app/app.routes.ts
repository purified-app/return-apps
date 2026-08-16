import { Routes } from '@angular/router';
import { NfcPage } from './features/nfc/nfc.page';

export const routes: Routes = [
  { path: '', component: NfcPage },
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
  { path: 'nfc', redirectTo: '' },
  { path: '**', redirectTo: '' },
];
