import { Routes } from '@angular/router';
import { ScanPage } from './features/scan/scan.page';

export const routes: Routes = [
  { path: '', component: ScanPage },
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
  { path: 'scan', redirectTo: '' },
  { path: '**', redirectTo: '' },
];
