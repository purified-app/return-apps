import { Routes } from '@angular/router';
import { OrientPage } from './features/orient/orient.page';

export const routes: Routes = [
  { path: '', component: OrientPage },
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
  { path: 'orient', redirectTo: '' },
  { path: '**', redirectTo: '' },
];
