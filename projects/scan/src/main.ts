import { bootstrapApplication } from '@angular/platform-browser';
import { reloadOnChunkLoadError } from 'shared-ui';
import { appConfig } from './app/app.config';
import { App } from './app/app';

reloadOnChunkLoadError();
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
