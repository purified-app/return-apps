import { Routes } from '@angular/router';
import { SignPage } from './features/sign/sign.page';

export const routes: Routes = [
  { path: '', component: SignPage },
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
  { path: 'sign', redirectTo: '' },
  { path: '**', redirectTo: '' },
];
