import { Routes } from '@angular/router';
import { LevelPage } from './features/level/level.page';

export const routes: Routes = [
  { path: '', component: LevelPage },
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
  { path: 'level', redirectTo: '' },
  { path: '**', redirectTo: '' },
];
