import { Routes } from '@angular/router';
import { CompassPage } from './features/compass/compass.page';

export const routes: Routes = [
  { path: '', component: CompassPage },
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
  { path: 'compass', redirectTo: '' },
  { path: '**', redirectTo: '' },
];
