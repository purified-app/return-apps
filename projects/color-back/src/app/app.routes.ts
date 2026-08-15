import { Routes } from '@angular/router';
import { ColorPage } from './features/color/color.page';

export const routes: Routes = [
  { path: '', component: ColorPage },
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
