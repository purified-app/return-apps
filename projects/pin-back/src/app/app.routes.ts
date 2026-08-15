import { Routes } from '@angular/router';
import { PinPage } from './features/pin/pin.page';

export const routes: Routes = [
  { path: '', component: PinPage },
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
  { path: 'pin', redirectTo: '' },
  { path: '**', redirectTo: '' },
];
