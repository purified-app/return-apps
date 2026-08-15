import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/color/color.page').then((m) => m.ColorPage),
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
  { path: 'color', redirectTo: '' },
  { path: '**', redirectTo: '' },
];
