import {InjectionToken} from '@angular/core';


export const OPEN_CV_CDN_URL = new InjectionToken<string>('OPEN_CV_CDN_URL', {
  providedIn: 'root',
  factory: () => 'https://cdn.jsdelivr.net/npm/@techstark/opencv-js/+esm'
});
