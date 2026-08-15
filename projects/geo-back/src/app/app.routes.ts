import { Routes } from '@angular/router';
import { GeoPage } from './features/geo/geo.page';

export const routes: Routes = [
  { path: '', component: GeoPage },
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
  { path: 'geo', redirectTo: '' },
  { path: '**', redirectTo: '' },
];
