import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/pin/pin.page').then((m) => m.PinPage),
  },
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
