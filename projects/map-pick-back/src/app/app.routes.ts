import { Routes } from '@angular/router';
import { MapPage } from './features/map/map.page';

export const routes: Routes = [
  { path: '', component: MapPage },
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
  { path: 'map', redirectTo: '' },
  { path: '**', redirectTo: '' },
];
