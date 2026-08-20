/** Framework-free entry that defers Angular until local or CDN startup is selected. */
import { startBrowserApplication } from './bootstrap/browser-startup';

startBrowserApplication().catch((error: unknown) => console.error(error));
