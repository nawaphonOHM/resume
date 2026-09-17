[![DigitalOcean Referral Badge](https://web-platforms.sfo2.cdn.digitaloceanspaces.com/WWW/Badge%201.svg)](https://www.digitalocean.com/?refcode=e2085a54adea&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=badge)
<br><br><br>
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![Dependabot Updates](https://github.com/nawaphonOHM/resume/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/nawaphonOHM/resume/actions/workflows/dependabot/dependabot-updates)
[![Angular](https://img.shields.io/badge/Angular-22.1-DD0031.svg?style=flat-square&logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4.svg?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-4.1-6E9F18.svg?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.22.3-339933.svg?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)

# Nawaphon Isarathanachaikul — Résumé Portfolio

A high-performance, single-page interactive curriculum vitae and professional portfolio for **Nawaphon Isarathanachaikul** (Backend Software Engineer / Full-Stack Engineer). Built with **Angular 22** standalone components, **Angular Material 22**, **Tailwind CSS v4**, and **Vitest 4**, this application demonstrates modern web engineering practices, reactive Signal architecture, Inverted Dependency Injection, client-side WebAssembly computer vision (OpenCV.js CLAHE), physics-driven orbital animations, dynamic UTC+7 availability scheduling with live CDN favicon switching, and streaming PDF downloads with real-time progress feedback.

## Key Features

- **Angular 22 Signals Architecture**: Standalone component model with fine-grained Signal state (`signal`, `computed`, `effect`, `input`, `output`) and native control flow (`@if`, `@for`, `@switch`).
- **Inverted Dependency Injection**: Strict decoupling of data tokens, utility functions, physical constants, and UI components via granular `InjectionToken` definitions in `src/app/helper/injection-token/`.
- **Live UTC+7 Bangkok Clock & Dynamic Status Favicon**: Real-time availability engine that tracks working hours in Asia/Bangkok time, drives status dot harmonic luminance oscillation ($f = 0.5\text{ Hz}$), and dynamically updates the browser favicon from CDN endpoints (`/favicons/{available|limited|unavailable}/favicon.svg`).
- **Physics-Driven Orbital Badges**: Hero section code badge kinematics computed in 60fps frame loops via parametric trigonometry ($x = r \cdot A \cos(\omega t + \phi)$, $y = r \cdot A \sin(\omega t + \phi)$) with deterministic frequency derived from the calendar day of the month ($f = \text{dayOfMonth} / 3600\text{ Hz}$).
- **Client-Side OpenCV.js CLAHE Image Enhancement**: Real-time contrast optimization for dark technology icons using WebAssembly CLAHE in CIE $L^*a^*b^*$ color space with cooperative idle scheduling (`requestIdleCallback`) and explicit C++ memory management.
- **Smart Image Zoom Previews**: Image preview overlay powered by Angular CDK Overlay with `ResizeObserver`-driven downscale detection and automatic viewport collision containment.
- **Resilient Streaming PDF Download & Pre-Flight Verification**: User-triggered résumé PDF download featuring pre-flight remote asset availability verification (`HEAD` request), reactive availability status signaling (`isAvailable`), accessible confirmation alert dialog (`ResumePdfConfirmDialog`) for proceeding with unverified or unavailable assets, Angular `HttpClient` event streaming with real-time percentage progress tracking, and automatic object URL cleanup.
- **Material 3 Theme System & Print Foundation**: CSS `@property` color token interpolation supporting Light, Dark, and System modes with dedicated A4 print layout stylesheets and WCAG AA accessibility compliance.

## Technology Stack

| Category                 | Technology / Package                                                                    | Version      | Purpose / Architectural Role                                                       |
| :----------------------- | :-------------------------------------------------------------------------------------- | :----------- | :--------------------------------------------------------------------------------- |
| **Core Framework**       | [Angular](https://angular.dev/) (`@angular/core`)                                       | `^22.1.6`    | Reactive web application framework with Signals & standalone components            |
| **UI Components**        | [Angular Material](https://material.angular.io/) (`@angular/material`)                  | `^22.1.6`    | Material 3 UI component system (buttons, navigation, progress spinners)            |
| **Component CDK**        | [Angular CDK](https://material.angular.io/cdk/categories) (`@angular/cdk`)              | `^22.1.6`    | Overlay popovers, accessibility primitives, and layout utilities                   |
| **Styling Engine**       | [Tailwind CSS](https://tailwindcss.com/) (`tailwindcss`, `@tailwindcss/postcss`)        | `^4.3.3`     | Utility-first CSS v4 engine with `@theme inline` and custom properties             |
| **Programming Language** | [TypeScript](https://www.typescriptlang.org/) (`typescript`)                            | `~6.0.2`     | Strongly-typed JavaScript with strict type checking and modern ECMAScript features |
| **Build & Dev Tooling**  | [Angular CLI & Build](https://angular.dev/tools/cli) (`@angular/build`, `@angular/cli`) | `^22.1.8`    | Application bundler and Vite/esbuild development server                            |
| **Unit Testing**         | [Vitest](https://vitest.dev/) (`vitest`, `@angular/build:unit-test`, `jsdom`)           | `^4.1.11`    | High-performance unit test runner executing in simulated DOM environment           |
| **Reactive Streams**     | [RxJS](https://rxjs.dev/) (`rxjs`)                                                      | `~7.8.0`     | Asynchronous event streams, HTTP progress event observation, and timers            |
| **Code Formatting**      | [Prettier](https://prettier.io/) (`prettier`)                                           | `^3.8.1`     | Multi-language code formatter for TypeScript, HTML, SCSS, JSON, and Markdown       |
| **Dependency Analysis**  | [Skott](https://github.com/antoine-coulon/skott) (`skott`)                              | `^0.35.11`   | Architectural dependency graph visualization and cycle detection                   |
| **Computer Vision**      | [OpenCV.js](https://docs.opencv.org/) (`@techstark/opencv-js` via CDN)                  | jsDelivr ESM | Client-side WebAssembly CLAHE contrast enhancement pipeline                        |
| **Iconography**          | [Google Material Icons](https://fonts.google.com/icons) (`material-icons`)              | `^1.13.14`   | Material design system icon font                                                   |
| **Runtime Environment**  | [Node.js](https://nodejs.org/)                                                          | `>=22.22.3`  | JavaScript runtime environment (compatible with Node.js 22 LTS and Node.js 24)     |
| **Package Manager**      | [npm](https://www.npmjs.com/)                                                           | `10.9.8`     | Project package manager and script execution engine                                |

## Requirements & Prerequisites

- **Node.js**: Version `22.22.3` or newer (configured in `package.json` engines as `>=22.22.3`; Node.js 22 LTS or Node.js 24 recommended).
- **npm**: Version `10.9.8` or compatible npm 10+.

## Getting Started

### 1. Clone & Install Dependencies

```bash
npm ci
```

### 2. Start Local Development Server

```bash
npm start
```

Navigate to `http://localhost:4200/`. The development server supports live reloading and hot module replacement as source files are modified.

## Architecture & Core Design Patterns

The application is structured around modern Angular standalone architecture, fine-grained Signal reactivity, Inverted Dependency Injection via modular `InjectionToken`s, computer vision algorithms, and real-time kinematic calculations.

```mermaid
graph TD
    subgraph Entry["Application Shell"]
        MAIN["main.ts"] --> APP["App (app.ts)"]
        MAIN --> APP_CONFIG["appConfig (app.config.ts)"]
        APP_CONFIG --> ROUTES["routes (app.routes.ts)"]
    end

    subgraph PageLayer["Routed Page & Presentational Sections"]
        ROUTES -->|loadComponent| RESUME_PAGE["ResumePage<br/>resume-page.ts"]
        RESUME_PAGE --> NAV["ResumeNavigation"]
        NAV -.->|themeToggled| RESUME_PAGE
        NAV -.->|downloadRequested| RESUME_PAGE
        RESUME_PAGE -.->|confirm on unavailable| PDF_DIALOG["ResumePdfConfirmDialog<br/>dialog/resume-pdf-confirm-dialog/"]
        RESUME_PAGE --> HERO["HeroSection"]
        RESUME_PAGE --> SUMMARY["SummarySection"]
        RESUME_PAGE --> EXPERIENCE["ExperienceTimeline"]
        RESUME_PAGE --> EDUCATION["EducationSection"]
        RESUME_PAGE --> PROFILE["ProfileSidebar"]
        EXPERIENCE --> TECHNOLOGY_ICON["TechnologyIconComponent"]
    end

    subgraph Interactive["Directives, Services & Overlays"]
        EXPERIENCE -.->|appImageZoom| ZOOM_DIRECTIVE["ImageZoomDirective"]
        EDUCATION -.->|appImageZoom| ZOOM_DIRECTIVE
        PROFILE -.->|appImageZoom| ZOOM_DIRECTIVE
        TECHNOLOGY_ICON -.->|appImageZoom| ZOOM_DIRECTIVE
        ZOOM_DIRECTIVE --> ZOOM_SERVICE["ImageZoomService"]
        ZOOM_SERVICE -->|CDK Overlay| ZOOM_PREVIEW["ImageZoomPreview"]
        RESUME_PAGE --> THEME_SERVICE["ThemeService"]
        RESUME_PAGE --> PDF_SERVICE["ResumePdfService<br/>HEAD pre-flight & GET stream"]
        TECHNOLOGY_ICON --> CONTRAST_SERVICE["TechnologyIconContrastService"]
    end

    subgraph DataTokens["Canonical Data & Fine-Grained Injection Tokens"]
        RESUME_DATA["resumeData<br/>resume.data.ts"] --> RESUME_PAGE
        PDF_URL["RESUME_PDF_DOWNLOAD_URL"] --> PDF_SERVICE
        PDF_NAME["RESUME_PDF_FILENAME"] --> PDF_SERVICE
        SECTIONS_TOKEN["RESUME_SECTIONS"] --> RESUME_PAGE
        SECTIONS_TOKEN --> NAV
        HERO_MATH["HERO_CODE_* & Kinematics Tokens"] --> HERO
        STATUS_MATH["STATUS_LUMINANCE_* & UTC+7 Tokens"] --> HERO
        CONTRAST_TOKENS["CLAHE, OpenCV & Color Tokens"] --> CONTRAST_SERVICE
        OVERLAY_TOKENS["VIEWPORT_MARGIN, ORIGIN_GAP Tokens"] --> ZOOM_SERVICE
    end

    subgraph External["External Assets & CDN Runtimes"]
        PDF_SERVICE -.->|HEAD check & GET stream| PDF_ASSET["DigitalOcean Spaces CDN<br/>Hosted PDF Asset"]
        CONTRAST_SERVICE -.->|lazy ESM import| OPENCV_CDN["jsDelivr CDN<br/>@techstark/opencv-js"]
        EXPERIENCE -.->|remote images| DO_SPACES["DigitalOcean Spaces CDN<br/>image assets"]
        EDUCATION -.->|remote images| DO_SPACES
        PROFILE -.->|remote images| DO_SPACES
        TECHNOLOGY_ICON -.->|remote icons| DO_SPACES
        HERO -.->|dynamic favicon link| FAVICON_CDN["DigitalOcean Spaces CDN<br/>/favicons/{status}/favicon.svg"]
    end
```

### 1. Modern Angular Signals & Native Control Flow

The application fully embraces Angular's standalone component architecture and fine-grained reactive primitives:

- **Signal-Based Inputs & Outputs**: All components consume props via `input.required<T>()` and `input<T>()`, and emit events using `output<T>()`, eliminating legacy `@Input` and `@Output` decorators.
- **Derived Reactive State (`computed`)**: Derived computations (such as navigation section activation, PDF spinner determinate/indeterminate states, and dynamic fallback presentations) are modelled as pure `computed()` signals that recalculate on-demand when dependencies change.
- **Asynchronous Data Resources (`resource`)**: `TechnologyIconComponent` utilizes Angular's `resource()` API with `params` and `loader` definitions to asynchronously coordinate client-side OpenCV CLAHE contrast optimizations.
- **Linked Reactive State (`linkedSignal`)**: `TechnologyIconComponent` employs `linkedSignal` to automatically reset image loading state whenever the underlying logo image source URL changes:
  ```typescript
  protected readonly isLoading = linkedSignal<string, boolean>({
    source: () => this.presentation().logo.src,
    computation: () => true,
  });
  ```
- **Reactive Side Effects (`effect`)**: `HeroSection` uses `effect()` to synchronize the dynamic availability status color with `document.head` favicon links via `FaviconService`, and `ImageZoomDirective` uses `effect()` to cleanly tear down CDK overlay preview state on cleanup.
- **Native Control Flow**: All Angular HTML templates use native `@if`, `@else`, `@for (item of items; track item.id)`, and `@switch` blocks, avoiding legacy structural directives (`*ngIf`, `*ngFor`).

### 2. Inverted Dependency Injection Architecture

Rather than relying on large monolithic service classes with hardcoded configuration constants, the application adheres to strict **Inverted Dependency Injection (Inverted DI)**. Over 60 fine-grained `InjectionToken` definitions reside in `src/app/helper/injection-token/`, decoupling parameters, math formulas, timing constants, pure transformation functions, and CDN URLs:

- **Kinematics & Orbital Badges**: `HERO_CODE_R_LEFT`, `HERO_CODE_R_RIGHT`, `HERO_CODE_PHI_LEFT`, `HERO_CODE_PHI_RIGHT`, `HERO_CODE_A`, `HERO_CODE_F`, `HERO_CODE_OMEGA`, `calculateHeroCodePosition`.
- **Availability Scheduling & Photometry**: `UTC_PLUS_SEVEN_OFFSET_MS`, `CLOCK_UPDATE_INTERVAL_MS`, `STATUS_LUMINANCE_A`, `STATUS_LUMINANCE_F`, `STATUS_LUMINANCE_OMEGA`, `STATUS_LUMINANCE_PHI`, `calculateStatusLuminance`, `statusColor`, `statusColorForUtcPlusSeven`, `statusFaviconForStatusColor`.
- **Computer Vision & CLAHE**: `OPEN_CV_CDN_URL`, `TECHNOLOGY_ICON_OPEN_CV_LOADER`, `CLAHE_CLIP_LIMIT`, `CLAHE_TILE_PIXEL_TARGET`, `MIN_CLAHE_TILES`, `MAX_CLAHE_TILES`, `IDLE_TIMEOUT_MS`, `OPEN_CV_RETRY_COUNT`, `OPEN_CV_RETRY_DELAY_MS`, `OPEN_CV_RETRY_DELAY_MULTIPLIER`, `OPEN_CV_RETRY_JITTER_MS`, `dispose`, `normalizeOpenCvExport`, `linearizeChannel`, `relativeLuminance`.
- **Overlay & Geometry**: `VIEWPORT_MARGIN`, `IMAGE_MAX_VIEWPORT_RATIO`, `ORIGIN_GAP`, `PANEL_CHROME_PX`, `IMAGE_ZOOM_POSITIONS`, `IMAGE_ZOOM_PREVIEW_DATA`, `DOWNSCALE_TOLERANCE`, `INITIAL_IMAGE_STATE`.
- **Theme & Storage**: `RESUME_THEME_STORAGE_KEY`, `THEME_CLASSES`, `THEME_TRANSITION_CLASS`, `THEME_TRANSITION_DURATION_MS`.
- **PDF & Navigation**: `RESUME_PDF_DOWNLOAD_URL`, `RESUME_PDF_FILENAME`, `RESUME_SECTIONS`, `SECTION_ACTIVATION_RATIO`, `VIEWPORT_EVENT_THROTTLE_MS`, `resumeData`.

**Architectural Benefits:**

1. **Isolated Single Responsibility**: Each file exports exactly one token or pure functional helper.
2. **Granular Testability**: Unit tests can override any single parameter (e.g., `CLAHE_CLIP_LIMIT` or `UTC_PLUS_SEVEN_OFFSET_MS`) in Angular `TestBed` providers without mocking entire classes.
3. **Tree-Shaking & Bundle Optimization**: Unused configurations are automatically pruned during production compilation.

### 3. Live UTC+7 Bangkok Availability Schedule & Dynamic CDN Favicon

The application features a real-time availability engine tracking working hours in the **Asia/Bangkok (UTC+7)** timezone:

- **Fixed Offset Calculation**: Time is computed with a fixed UTC offset of $+7\text{ hours} = 7 \times 3,600,000\text{ ms} = 25,200,000\text{ ms}$ (`UTC_PLUS_SEVEN_OFFSET_MS`), immune to client device timezone discrepancies.
- **Availability State Machine (`statusColorForUtcPlusSeven`)**:
  - **Weekdays (Monday–Friday)**:
    - `06:00 – 09:00`: `limited` (`#F7A600`, Morning flex/preparation)
    - `09:00 – 12:00`: `available` (`#92C353`, Core focus hours)
    - `12:00 – 13:00`: `limited` (`#F7A600`, Lunch break)
    - `13:00 – 18:00`: `available` (`#92C353`, Core collaboration hours)
    - `18:00 – 22:00`: `limited` (`#F7A600`, Evening flexible availability)
    - `22:00 – 06:00`: `unavailable` (`#D1D1D1`, Rest/offline)
  - **Weekends (Saturday & Sunday)**:
    - `06:00 – 22:00`: `limited` (`#F7A600`, Weekend flexible availability)
    - `22:00 – 06:00`: `unavailable` (`#D1D1D1`, Rest/offline)
- **Dynamic CDN Favicon Switching**:
  The active status color is dynamically mapped by `statusFaviconForStatusColor` to remote SVG favicon endpoints on DigitalOcean Spaces:
  - Available: `https://resume-images.ohm-mho.space/favicons/available/favicon.svg`
  - Limited: `https://resume-images.ohm-mho.space/favicons/limited/favicon.svg`
  - Unavailable: `https://resume-images.ohm-mho.space/favicons/unavailable/favicon.svg`

  `FaviconService` updates the `<link rel="icon">` element in `document.head` reactively inside an `effect()` in `HeroSection`.

### 4. Trigonometric Kinematics & 2D Orbital Physics

`HeroSection` drives real-time mathematical motion calculations at 60fps via `requestAnimationFrame` and CSS custom properties:

- **Parametric Circular Orbital Kinematics**:
  The hero code badges orbit continuously around the central avatar along parametric circular trajectories, with the left badge orbital frequency scaled by the radius ratio ($r_{\text{right}} / r_{\text{left}}$):
  $$\theta_{\text{left}}(t) = \omega\left(f \cdot \frac{r_{\text{right}}}{r_{\text{left}}}\right) \cdot t + \phi_{\text{left}}$$
  $$x_{\text{left}}(t) = r_{\text{left}} \cdot A \cdot \cos(\theta_{\text{left}}(t)), \quad y_{\text{left}}(t) = r_{\text{left}} \cdot A \cdot \sin(\theta_{\text{left}}(t))$$
  $$\theta_{\text{right}}(t) = \omega(f) \cdot t + \phi_{\text{right}}$$
  $$x_{\text{right}}(t) = r_{\text{right}} \cdot A \cdot \cos(\theta_{\text{right}}(t)), \quad y_{\text{right}}(t) = r_{\text{right}} \cdot A \cdot \sin(\theta_{\text{right}}(t))$$

- **Exact Physical Parameters**:
  - **Amplitude ($A$)**: $1$ (`HERO_CODE_A`)
  - **Orbital Radii ($r$)**: $r_{\text{left}} = 37\%$ (`HERO_CODE_R_LEFT`), $r_{\text{right}} = 50\%$ (`HERO_CODE_R_RIGHT`)
  - **Phase Offsets ($\phi$)**: $\phi_{\text{left}} = \frac{7\pi}{6}\text{ rad} = 210^\circ$ (`HERO_CODE_PHI_LEFT`), $\phi_{\text{right}} = \frac{\pi}{6}\text{ rad} = 30^\circ$ (`HERO_CODE_PHI_RIGHT`)
  - **Calendar-Derived Dynamic Frequency ($f$)**: The base cyclic frequency parameter (`HERO_CODE_F`) derives dynamically from the UTC+7 day of the month:
    $$f = \frac{\text{dayOfMonth}}{\text{secondsPerHour}} = \frac{\text{dayOfMonth}}{3600}\text{ Hz}$$
    For example, on the 1st of the month $f = \frac{1}{3600}\text{ Hz}$ ($1\text{ rev/hour}$), while on the 31st $f = \frac{31}{3600}\text{ Hz}$ ($31\text{ rev/hour}$).
  - **Angular Velocity Function ($\omega(f)$)**: $\omega(f) = 2\pi f$ (`HERO_CODE_OMEGA`), calculating $\omega\left(f \cdot \frac{r_{\text{right}}}{r_{\text{left}}}\right)$ for the left badge and $\omega(f)$ for the right badge.

- **Harmonic Status Dot Luminance Oscillation**:
  The availability dot pulses with simple harmonic motion:
  $$L(t) = \operatorname{clamp}\left(0.5 + A \cdot \cos(\omega t + \phi), 0, 1\right)$$
  where $A = 0.5$ (`STATUS_LUMINANCE_A`), $f = 0.5\text{ Hz}$ (`STATUS_LUMINANCE_F`, period $T = 2\text{ s}$), $\omega = \pi\text{ rad/s}$ (`STATUS_LUMINANCE_OMEGA`), and $\phi = 0\text{ rad}$ (`STATUS_LUMINANCE_PHI`).

  The calculated value is mapped to the CSS custom property `--status-dot-luminance` to drive an OKLCH color-mix glow effect.

- **Frame Loop Lifecycle & Reduced-Motion Accessibility**:
  - Initiated after first render (`afterNextRender`) using `requestAnimationFrame` with precise elapsed-time tracking ($t = (t_{\text{current}} - t_{\text{start}}) / 1000$).
  - Cleanly teardown via `DestroyRef.onDestroy()` canceling pending animation frames.
  - `@media (prefers-reduced-motion: reduce)` clamps coordinates to static defaults ($x_{\text{left}}=-37\%, y_{\text{left}}=0\%, x_{\text{right}}=50\%, y_{\text{right}}=0\%, L=0.5$).

### 5. Client-Side OpenCV.js CLAHE Image Enhancement Pipeline

`TechnologyIconContrastService` (`src/app/resume/experience-timeline/technology-icon/service/technology-icon-contrast/technology-icon-contrast.service.ts`) optimizes low-contrast dark technology marks directly in the user's browser using WebAssembly computer vision:

```mermaid
flowchart TD
    A[SVG Icon URL] --> B[requestIdleCallback Scheduling]
    B --> C[Offscreen Canvas 2D Rasterization]
    C --> D[Lazy Dynamic ESM Import: OpenCV.js]
    D --> E[Alpha Compositing over Surface RGB]
    E --> F[Convert RGBA to RGB to CIE Lab]
    F --> G[Extract L* Lightness Channel]
    G --> H[Apply cv.CLAHE clipLimit=2.0, adaptive tileGrid]
    H --> I[Merge Enhanced L* with a* and b* Chrominance]
    I --> J[Convert CIE Lab back to RGB]
    J --> K[Re-composite Alpha Mask]
    K --> L[Evaluate WCAG 2.1 Contrast on Light vs Dark Surfaces]
    L --> M[Select Optimal Card Presentation]
    M --> N[Explicit Native WebAssembly Memory Disposal]
```

1. **Cooperative Idle Scheduling**: Defers processing via `requestIdleCallback` (`IDLE_TIMEOUT_MS = 1000ms`), ensuring zero main-thread contention during initial page load.
2. **Lazy ESM Import & Retry Loop**: Dynamically imports `@techstark/opencv-js` from jsDelivr CDN (`https://cdn.jsdelivr.net/npm/@techstark/opencv-js/+esm`) on demand, utilizing configured retry parameters (`OPEN_CV_RETRY_COUNT = 3`, `OPEN_CV_RETRY_DELAY_MS = 1000ms`, `OPEN_CV_RETRY_DELAY_MULTIPLIER = 1.0`, `OPEN_CV_RETRY_JITTER_MS = 0`).
3. **Color Space Transformation**: Converts canvas RGBA pixels $\to$ RGB $\to$ CIE $L^*a^*b^*$ (`cv.cvtColor`).
4. **Adaptive Tile Grid CLAHE**: Calculates local tile grid dimensions based on target tile pixel size ($16\text{px}$) clamped between $2$ and $8$ tiles:
   $$\text{tileCount} = \operatorname{clamp}\left(\left\lceil\frac{\text{dimension}}{\text{target}}\right\rceil, 2, 8\right)$$
   Applies `cv.CLAHE(clipLimit = 2.0, tileGrid)` exclusively to the $L^*$ channel while preserving chromaticity ($a^*, b^*$).
5. **Dual Candidate Surface Scoring**:
   Evaluates original and enhanced marks across `LightSurface` (`#ffffff`, RGB `[255, 255, 255]`) and `DarkSurface` (`#0d1b2d`, RGB `[13, 27, 45]`).
   Computes alpha-weighted WCAG 2.1 relative luminance contrast:
   $$\text{Contrast} = \frac{\max(L_{\text{bg}}, L_{\text{fg}}) + 0.05}{\min(L_{\text{bg}}, L_{\text{fg}}) + 0.05}$$
   where linear luminance is derived via standard sRGB gamma linearization ($C_{\text{lin}} = C / 12.92$ if $C \le 0.04045$ else $((C + 0.055) / 1.055)^{2.4}$) and relative luminance $L = 0.2126 R_{\text{lin}} + 0.7152 G_{\text{lin}} + 0.0722 B_{\text{lin}}$.
6. **Strict Native WebAssembly Memory Disposal**:
   JavaScript garbage collection cannot reclaim native C++ allocations in the WebAssembly heap. The service explicitly frees all `cv.Mat`, `cv.MatVector`, `cv.Size`, and `cv.CLAHE` instances in `finally` blocks via `dispose()` and `.delete()`.
7. **In-Flight Deduplication**: Optimizations are memoized by icon source and dimensions, returning PNG data URLs.

### 6. Image Zoom & Angular CDK Overlay System

Located at `src/app/helper/directive/image-zome/image-zoom.directive.ts` and `src/app/resume/image-zoom-preview/`:

- **Downscale Detection via `ResizeObserver`**:
  `ImageZoomDirective` inspects the host image's natural dimensions against its rendered content box (excluding border and padding).
  $$\text{containedScale} = \min\left(\frac{\text{width}_{\text{content}}}{\text{naturalWidth}}, \frac{\text{height}_{\text{content}}}{\text{naturalHeight}}\right)$$
  An image is eligible for zoom if and only if $\text{containedScale} < 1 - \text{DOWNSCALE\_TOLERANCE}$ (with `DOWNSCALE_TOLERANCE = 0.01` and `INITIAL_IMAGE_STATE` injected via Angular `InjectionToken`). 1:1, upscaled, or broken images remain inert.
- **Dual Interaction Ownership**:
  - **Hover Mode**: Pointer hover (`pointerenter`) opens the preview with `pointer-events: none` on the overlay pane to prevent cursor flickering. `pointerleave` closes the preview.
  - **Touch Mode**: Mobile touch tap (`click`) toggles the preview open with interactive overlay dismissal.
- **Viewport-Bounded CDK Overlay Placement**:
  `ImageZoomService` positions previews using connected position strategies (`IMAGE_ZOOM_POSITIONS` trying right, left, bottom, top with `ORIGIN_GAP = 12px`), enforces boundary margins (`VIEWPORT_MARGIN = 16px`), accounts for frame padding/borders (`PANEL_CHROME_PX = 26px`), and clamps maximum viewport share (`IMAGE_MAX_VIEWPORT_RATIO = 0.20`).
- **Global Dismissals**: Subscribes to outside clicks, `Escape` keypresses, and route navigation.

### 7. On-Demand Streaming PDF Download & Availability Verification System

Located at `src/app/resume/resume-page/service/resume-pdf/resume-pdf.service.ts` and `src/app/resume/resume-page/dialog/resume-pdf-confirm-dialog/`:

- **Pre-Flight Remote Asset Availability Verification (`checkAvailability`)**:
  When running in a browser environment (`isPlatformBrowser(this.platformId)`), `ResumePdfService` automatically initiates an asynchronous `HEAD` request to `RESUME_PDF_DOWNLOAD_URL` to verify whether the hosted asset returns an active `2xx` HTTP response status. The state is published via a reactive read-only signal:
  ```typescript
  readonly isAvailable: Signal<boolean | null> = this._isAvailable.asReadonly();
  ```
  where `null` represents verification in progress, `true` confirms asset availability, and `false` handles network errors, non-2xx status codes, or non-browser (SSR) execution.
- **Visual Warning & Responsive Navigation States**:
  `ResumeNavigation` receives the `downloadAvailable` input signal to dynamically adjust its action indicators:
  - When unavailable (`downloadAvailable() === false`), the download trigger displays a `file_download_off` Material icon with a tooltip (_"Resume PDF might be unavailable. Click to confirm download anyway."_) and an accessibility label (_"Download résumé as PDF (file may be unavailable)"_).
  - When verified or checking, standard `download` iconography and labels are shown.
- **Accessible Confirmation Dialog (`ResumePdfConfirmDialog`)**:
  If a user initiates a download while `downloadAvailable() === false`, `ResumePage` intercepts the request and opens `ResumePdfConfirmDialog` configured with `{ role: 'alertdialog', disableClose: true }`:
  - **Modal Persistence (`disableClose: true`)**: Disables outside/backdrop clicks and Escape dismissal to enforce explicit user resolution through modal action buttons.
  - **Cancel**: Emits `false` (`ResumePdfConfirmDialogResult`), aborting the download without triggering network requests or pending progress states.
  - **Continue**: Emits `true`, allowing the user to proceed with the binary streaming request.
- **HTTP Event Streaming & Progress Observation**:
  Streams the remote résumé PDF (`https://resume-images.ohm-mho.space/downloadable-resume/Nawaphon_Isarathanachaikul.pdf`) via Angular `HttpClient` using `{ reportDownloadProgress: true, observe: 'events', responseType: 'blob' }`.
- **Live Percentage Calculation**:
  Observes `HttpEventType.DownloadProgress` events, calculating real-time download percentage as:
  $$\text{percentage} = \operatorname{clamp}\left(\left\lfloor \frac{\text{loaded}}{\text{total}} \times 100 \right\rfloor, 0, 100\right)$$
- **Dynamic Spinner UI States**:
  - Renders `mat-progress-spinner` in `mode="indeterminate"` while establishing the HTTP stream or when the `total` content length is indeterminate.
  - Smoothly transitions to `mode="determinate"` with `[value]="downloadProgress()"` as streamed data arrives.
  - Emits live `aria-busy="true"` and descriptive `aria-label` updates (_"Downloading résumé PDF (45%)"_).
- **Blob Download & Guaranteed Object URL Revocation**:
  Constructs a temporary anchor element to trigger browser file saving (`nawaphon-isarathanachaikul-resume-profile.pdf`), ensuring deterministic `window.URL.revokeObjectURL()` cleanup in a `finally` block.

---

## Styling Architecture & Design Tokens

The styling architecture leverages modern CSS standards, CSS Custom Properties with native `@property` registration, Tailwind CSS v4, Angular Material 3, and dedicated A4 print stylesheets.

```mermaid
flowchart TD
    subgraph CSSProps["CSS @property Registrations (src/styles.scss)"]
        PROP["@property --resume-page, --resume-surface, --resume-brand, etc.<br/>syntax: '<color>', inherits: true"]
    end

    subgraph ThemeEngine["Theme & Color Resolution"]
        LIGHT[":root / .resume-theme-light (Default)"] --> PROP
        DARK[".resume-theme-dark (SASS @each loop)"] --> PROP
        SYSTEM["@media (prefers-color-scheme: dark)"] --> PROP
        TRANS["html.resume-theme-transitioning<br/>250ms CSS color interpolation"] --> PROP
    end

    subgraph Utilities["Styling Consumers"]
        PROP --> TW["Tailwind CSS v4 @theme inline<br/>--color-page, --color-surface, --color-ink, etc."]
        PROP --> MAT["Angular Material 3 Theme (src/material-theme.scss)<br/>mat.theme(primary: $azure-palette, tertiary: $cyan-palette)"]
        PROP --> PRINT["@media print / @page A4 Layout<br/>Forced Light Scheme, Exact Colors, Pagination Breaks"]
    end
```

### 1. CSS `@property` Design Token System

Standard CSS custom properties normally treat color changes as discrete, non-interpolatable string substitutions. By formally registering each semantic custom property with `@property` in `src/styles.scss`, the browser's CSS layout engine understands their computational syntax (`syntax: '<color>'`), allowing smooth color transitions:

```scss
@property --resume-page {
  syntax: '<color>';
  inherits: true;
  initial-value: #f4f7fb;
}

@property --resume-surface {
  syntax: '<color>';
  inherits: true;
  initial-value: #ffffff;
}

@property --resume-text {
  syntax: '<color>';
  inherits: true;
  initial-value: #172033;
}

@property --resume-brand {
  syntax: '<color>';
  inherits: true;
  initial-value: #123b67;
}
```

Registered semantic tokens include:

- Surface & Canvas: `--resume-page`, `--resume-surface`, `--resume-surface-raised`, `--resume-sidebar`
- Typography & Outlines: `--resume-text`, `--resume-muted`, `--resume-border`, `--resume-sidebar-text`
- Brand & Accents: `--resume-brand`, `--resume-brand-strong`, `--resume-brand-soft`, `--resume-accent`
- Interaction & Effects: `--resume-focus`, `--resume-shadow-color`

### 2. Tailwind CSS v4 `@theme inline` Semantic Bridge

Tailwind CSS v4 utilities consume semantic custom properties through `@theme inline` in `src/styles.scss`, establishing a single source of truth without duplicating color constants:

```scss
@theme inline {
  --color-page: var(--resume-page);
  --color-surface: var(--resume-surface);
  --color-surface-raised: var(--resume-surface-raised);
  --color-ink: var(--resume-text);
  --color-muted: var(--resume-muted);
  --color-brand: var(--resume-brand);
  --color-brand-strong: var(--resume-brand-strong);
  --color-brand-soft: var(--resume-brand-soft);
  --color-accent: var(--resume-accent);
  --color-outline: var(--resume-border);
  --color-sidebar: var(--resume-sidebar);
  --color-sidebar-ink: var(--resume-sidebar-text);
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --breakpoint-xs: 30rem;
  --container-resume: 75rem;
  --radius-panel: 1.5rem;
  --shadow-soft: var(--resume-shadow);
}
```

### 3. Angular Material 3 Global Theme Configuration

`src/material-theme.scss` configures Angular Material 3 using the modern M3 mixin `@include mat.theme(...)`:

- **Color Palettes**: Primary palette mapped to `mat.$azure-palette`, tertiary accent to `mat.$cyan-palette`, and `theme-type: color-scheme` to harmonize with system/custom modes.
- **Typography**: System font family stack (`system-ui, sans-serif`) with standard weights (regular 400, medium 600, bold 700).
- **Density**: Default density (`0`) ensuring touch-friendly tap targets and high readability.

### 4. Dynamic Theme Switching & Interpolation Lifecycle

Managed by `ThemeService` (`src/app/helper/core/theme.service.ts`) with theme configuration parameters modularized via Angular `InjectionToken`s:

1. **Injected Configuration Tokens**:
   - `RESUME_THEME_STORAGE_KEY`: Browser storage key (`resume-profile-theme`) for persisting user theme preferences.
   - `THEME_CLASSES`: Mutually exclusive root DOM classes (`resume-theme-light`, `resume-theme-dark`).
   - `THEME_TRANSITION_CLASS`: Transient root marker class (`resume-theme-transitioning`).
   - `THEME_TRANSITION_DURATION_MS`: Duration ($250\text{ ms}$) enabling smooth CSS color token interpolation.
2. **State & Persistence**: Theme state is exposed as an Angular Signal (`theme = signal<ResumeTheme>('light')`, `isDark = computed(...)`), persisted to `localStorage` under `RESUME_THEME_STORAGE_KEY` with defensive error handling.
3. **System Preference Synchronization**: Listens to `window.matchMedia('(prefers-color-scheme: dark)')` to follow OS preferences until the user explicitly toggles a choice.
4. **Smooth 250ms Color Interpolation**: On theme toggling, `ThemeService` adds the transient class `THEME_TRANSITION_CLASS` for `THEME_TRANSITION_DURATION_MS` ($250\text{ ms}$), allowing registered `@property` color tokens to interpolate smoothly without JavaScript frame overhead. Rapid toggling debounces the cleanup timer to prevent premature class removal.
5. **Print Lifecycle Coordination**: Automatically intercepts `beforeprint` and `afterprint` window events to apply print-safe light styling (`resume-theme-light`) during printing without modifying user theme preferences or storage.

### 5. Dedicated A4 Print Layout Foundation

When printing or exporting to PDF via browser print dialogs, `src/styles.scss` activates comprehensive print rules:

- **Page Box Geometry**: `@page { size: A4; margin: 11mm 12mm 13mm; }` defining precise A4 boundaries.
- **Deterministic Light Palette**: Forces high-contrast light colors (`--resume-page: #ffffff`, `--resume-text: #172033`, `color-scheme: light !important`) and `print-color-adjust: exact`.
- **Suppression of Transient Overlays & Animations**: Hides Angular CDK overlay containers (`.cdk-overlay-container { display: none !important; }`), decorative background blurs, animated badges, and resets all animations/transitions (`animation: none !important; box-shadow: none !important; transition: none !important;`).
- **Pagination & Page Break Controls**: Applies `break-inside: avoid` on timeline cards, headers, and highlights, and `break-before: page` on major sections to guarantee clean, unfragmented multi-page A4 layouts.
- **Point-Based Typography**: Scales all typography to typographic points (`9pt` body, `26pt` hero h1, `18pt` section h2, `12pt` card h3, `7.5pt`/`6.5pt` metadata and chips).

---

## Accessibility & Inclusive Design

The portfolio is engineered to meet strict accessibility standards:

- **WCAG 2.1 AA Compliance**: All text and interactive controls maintain contrast ratios exceeding the WCAG AA minimums ($4.5:1$ for normal body text, $3.0:1$ for large headings and icons) across both light and dark modes. The application is designed to satisfy automated accessibility check standards.
- **Skip-to-Main-Content Navigation**: An accessible skip link (`<a class="skip-link" routerLink="/" fragment="main-content">Skip to main content</a>`) is rendered at the top of the DOM, hidden offscreen until focused via keyboard navigation, allowing screen reader and keyboard users to bypass header controls directly to `<main id="main-content" tabindex="-1">`.
- **Keyboard Navigation & Focus Management**: High-visibility focus indicators are configured globally via `:focus-visible { outline: 0.1875rem solid var(--resume-focus); outline-offset: 0.1875rem; }`.
- **Screen Reader Announcements & ARIA Live Regions**:
  - The HTML pre-bootstrap splash loader and Angular `@defer` loading placeholders employ `role="status"`, `aria-live="polite"`, `aria-busy="true"`, and descriptive `aria-label` tags to communicate loading states.
  - The PDF download button dynamically announces state transitions, warning indicators for unavailable files, and live progress updates with `aria-label` and `aria-busy` attributes.
  - The PDF confirmation modal (`ResumePdfConfirmDialog`) implements `role="alertdialog"` with `disableClose: true` and focused action buttons for keyboard and screen reader accessibility.
  - Decorative image preview overlays created via the Angular CDK are marked as decorative (`aria-hidden="true"`) to screen readers, with dismissal handled automatically via outside-click or the Escape key.
- **Motion Reduction (`prefers-reduced-motion: reduce`)**:
  - CSS animations, transitions, and smooth scrolling are neutralized globally (`animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important;`).
  - In TypeScript, orbital kinematics in `HeroSection` and harmonic luminance pulsing in `ProfileSidebar` clamp positions and brightness to static defaults when reduced motion is detected.

---

## Project Structure

```text
resume/
├── .github/                      # GitHub Actions workflows & repository configuration
│   ├── workflows/
│   │   ├── junie-tag.yml         # Automated semantic release & tagging workflow
│   │   └── node.js.yml           # CI validation pipeline (build, test, format check)
│   ├── CODEOWNERS
│   └── dependabot.yml            # Automated dependency update configuration
├── public/                       # Static public assets
├── scripts/
│   └── test-runner.mjs           # Vitest execution runner with timeout & diagnostics
├── src/
│   ├── app/
│   │   ├── helper/               # Fine-grained DI tokens, services, directives, types, and pure functions
│   │   │   ├── core/             # Global singleton services
│   │   │   │   ├── favicon.service.ts         # Dynamic browser tab favicon management
│   │   │   │   ├── favicon.service.spec.ts
│   │   │   │   ├── theme.service.ts           # Light/Dark/System theme management & persistence
│   │   │   │   └── theme.service.spec.ts
│   │   │   ├── directive/        # Custom Angular directives
│   │   │   │   └── image-zome/   # Image zoom hover & touch directive
│   │   │   │       ├── image-zoom.directive.ts
│   │   │   │       └── image-zoom.directive.spec.ts
│   │   │   ├── injection-token/  # 60+ tree-shakable InjectionTokens & math functions
│   │   │   │   ├── clahe-*.variable.ts    # CLAHE parameters (clip limit, tile target)
│   │   │   │   ├── downscale-tolerance.variable.ts
│   │   │   │   ├── initial-image-state.variable.ts
│   │   │   │   ├── hero-code-*.variable.ts# Kinematic orbit parameters (radii, phase, omega)
│   │   │   │   ├── hero-code-position.function.ts
│   │   │   │   ├── resume-theme-storage-key.variable.ts
│   │   │   │   ├── theme-classes.variable.ts
│   │   │   │   ├── theme-transition-class.variable.ts
│   │   │   │   ├── theme-transition-duration-ms.variable.ts
│   │   │   │   ├── status-*.variable.ts   # Availability scheduling & luminance constants
│   │   │   │   ├── status-luminance.function.ts
│   │   │   │   ├── status-color-for-utc-plus-seven.function.ts
│   │   │   │   ├── status-favicon-for-status-color.function.ts
│   │   │   │   ├── resume.data.ts         # Canonical résumé content & career data
│   │   │   │   └── ...
│   │   │   ├── interface/        # Strongly-typed data structures & models
│   │   │   │   ├── brand-logo/            # Company and technology logo interfaces
│   │   │   │   ├── candidate/             # Candidate contact and bio schema
│   │   │   │   ├── card-surface/          # Light/Dark candidate surface evaluation
│   │   │   │   ├── disposable/            # WebAssembly resource cleanup interfaces
│   │   │   │   ├── experience/            # Work experience & employment data models
│   │   │   │   ├── resume-profile/        # Complete résumé profile data model
│   │   │   │   └── ...
│   │   │   └── type/             # TypeScript union types & type aliases
│   │   │       ├── card-surfaces.type.ts
│   │   │       ├── colors.type.ts
│   │   │       ├── download-progress-callback.type.ts
│   │   │       ├── image-zoom-payload.type.ts
│   │   │       ├── resume-pdf-confirm-dialog-result.type.ts
│   │   │       ├── resume-theme.type.ts
│   │   │       ├── status-color.type.ts
│   │   │       └── ...
│   │   ├── resume/               # Routed page & presentational feature components
│   │   │   ├── education-section/         # Academic background & degree history
│   │   │   │   ├── education-section.ts
│   │   │   │   ├── education-section.html
│   │   │   │   └── education-section.scss
│   │   │   ├── experience-timeline/       # Professional work experience timeline
│   │   │   │   ├── technology-icon/       # Standalone tech icon with OpenCV CLAHE
│   │   │   │   │   ├── service/technology-icon-contrast/
│   │   │   │   │   │   ├── technology-icon-contrast.service.ts
│   │   │   │   │   │   └── technology-icon-contrast.service.spec.ts
│   │   │   │   │   ├── technology-icon.ts
│   │   │   │   │   ├── technology-icon.html
│   │   │   │   │   ├── technology-icon.spec.ts
│   │   │   │   │   └── technology-icons.spec.ts
│   │   │   │   ├── experience-timeline.ts
│   │   │   │   ├── experience-timeline.html
│   │   │   │   └── experience-timeline.scss
│   │   │   ├── hero-section/              # Hero header with orbital code badge physics
│   │   │   │   ├── hero-section.ts
│   │   │   │   ├── hero-section.html
│   │   │   │   ├── hero-section.scss
│   │   │   │   └── hero-section.spec.ts
│   │   │   ├── image-zoom-preview/        # CDK Overlay zoomed image preview modal
│   │   │   │   ├── service/
│   │   │   │   │   ├── image-zoom.service.ts
│   │   │   │   │   └── image-zoom.service.spec.ts
│   │   │   │   ├── image-zoom-preview.ts
│   │   │   │   ├── image-zoom-preview.html
│   │   │   │   ├── image-zoom-preview.scss
│   │   │   │   └── image-zoom-preview.spec.ts
│   │   │   ├── profile-sidebar/           # Live UTC+7 clock & contact info sidebar
│   │   │   │   ├── profile-sidebar.ts
│   │   │   │   ├── profile-sidebar.html
│   │   │   │   └── profile-sidebar.scss
│   │   │   ├── resume-navigation/         # Header navigation bar & PDF download trigger
│   │   │   │   ├── resume-navigation.ts
│   │   │   │   ├── resume-navigation.html
│   │   │   │   ├── resume-navigation.scss
│   │   │   │   └── resume-navigation.spec.ts
│   │   │   ├── resume-page/               # Main routed container component
│   │   │   │   ├── dialog/
│   │   │   │   │   └── resume-pdf-confirm-dialog/
│   │   │   │   │       ├── resume-pdf-confirm-dialog.ts
│   │   │   │   │       ├── resume-pdf-confirm-dialog.html
│   │   │   │   │       └── resume-pdf-confirm-dialog.spec.ts
│   │   │   │   ├── service/resume-pdf/
│   │   │   │   │   ├── resume-pdf.service.ts
│   │   │   │   │   └── resume-pdf.service.spec.ts
│   │   │   │   ├── resume-page.ts
│   │   │   │   ├── resume-page.html
│   │   │   │   ├── resume-page.scss
│   │   │   │   └── resume-page.spec.ts
│   │   │   └── summary-section/           # Executive summary & core competencies
│   │   │       ├── summary-section.ts
│   │   │       ├── summary-section.html
│   │   │       └── summary-section.scss
│   │   ├── app.config.ts         # Application configuration & root providers
│   │   ├── app.html              # Root shell template with splash loader
│   │   ├── app.routes.ts         # Lazy-loaded application route table
│   │   ├── app.routes.spec.ts
│   │   ├── app.scss              # Root shell layout styles
│   │   ├── app.spec.ts
│   │   └── app.ts                # Root AppComponent
│   ├── index.html                # HTML entry point with pre-bootstrap splash loader
│   ├── main.ts                   # Angular application bootstrap entry point
│   ├── material-theme.scss       # Angular Material 3 global theme & typography
│   └── styles.scss               # Global design tokens, Tailwind v4, A4 print, a11y
├── angular.json                  # Angular CLI workspace & target configuration
├── package.json                  # Project metadata, dependencies, and npm scripts
├── tsconfig.app.json             # TypeScript compiler configuration for application
├── tsconfig.json                 # Base TypeScript compiler options
└── tsconfig.spec.json            # TypeScript compiler configuration for unit tests
```

---

## Static Assets & CDN Ecosystem

All static images, company logos, university emblems, dynamic status favicons, and the downloadable résumé PDF are distributed via DigitalOcean Spaces CDN:

- **CDN Origin**: `https://resume-images.ohm-mho.space`
- **Asset Directory Layout**:
  - `/company-logos/*`: Employer and client company brand logos.
  - `/technology-icons/*`: SVG technology brand marks (Java, Kotlin, TypeScript, Go, PostgreSQL, etc.).
  - `/university-logos/*`: University and academic institution emblems.
  - `/link-logos/*`: GitHub, LinkedIn, and email iconography.
  - `/favicons/{available|limited|unavailable}/favicon.svg`: Dynamic UTC+7 availability status favicons.
  - `/downloadable-resume/Nawaphon_Isarathanachaikul.pdf`: Canonical downloadable curriculum vitae PDF.
- **CORS Requirements**: The CDN bucket serves `Access-Control-Allow-Origin: *` headers, enabling unauthenticated browser `GET` requests, offscreen Canvas pixel extraction for CLAHE processing, and binary `HttpClient` progress streaming.
- **External WebAssembly Runtime**: OpenCV.js is dynamically imported on demand from `https://cdn.jsdelivr.net/npm/@techstark/opencv-js/+esm` (jsDelivr CDN).

---

## Editing Résumé Content

All publishable résumé facts live in `src/app/helper/injection-token/resume.data.ts` and strictly adhere to TypeScript interfaces in `src/app/helper/interface/resume-profile/resume-profile.interface.ts`. Update that central data source rather than duplicating content in component templates.

> **Privacy Notice**: The candidate phone value must remain `"Available on request"`. Do not add a private phone number, a `tel:` link, or unredacted personal contact information anywhere in the codebase.

---

## Development & Build Commands

All primary development workflows and validation tasks are managed through scripts defined in `package.json`:

| Command                        | Script / Invocation                            | Description                                                                              |
| :----------------------------- | :--------------------------------------------- | :--------------------------------------------------------------------------------------- |
| `npm start`                    | `ng serve`                                     | Launch the local Angular development server on `http://localhost:4200` with live reload. |
| `npm run build`                | `ng build --configuration production`          | Compile the static production deployment bundle to `dist/resume/browser/`.               |
| `npm run watch`                | `ng build --watch --configuration development` | Continuously compile development artifacts as project files change.                      |
| `npm test`                     | `ng test --watch=false`                        | Execute the full Vitest unit test suite once in non-watching mode.                       |
| `npm run format`               | `prettier --write .`                           | Automatically format all TypeScript, HTML, SCSS, JSON, and Markdown files.               |
| `npm run format:check`         | `prettier --check .`                           | Verify repository code formatting compliance against Prettier rules.                     |
| `npm run ng -- <args>`         | `ng <args>`                                    | Execute raw Angular CLI commands directly (e.g., `npm run ng -- version`).               |
| `node scripts/test-runner.mjs` | `scripts/test-runner.mjs`                      | Run unit tests with process timeout enforcement and structured failure diagnostics.      |

### Running Unit Tests

```bash
# Run unit tests once with Vitest
npm test

# Run tests with timeout guard and diagnostic extraction
node scripts/test-runner.mjs
```

The test runner utilizes Vitest via `@angular/build:unit-test` and `jsdom`. The test suite verifies components, services, custom directives, fine-grained injection tokens, mathematical functions, contrast enhancement routines, and streaming PDF download progress across 16 test suites and 200+ tests.

### Code Formatting

```bash
# Check formatting across all files without modifying
npm run format:check

# Automatically fix formatting across the entire codebase
npm run format
```

Prettier ensures consistent code formatting across all TypeScript files, Angular HTML templates, SCSS stylesheets, JSON configurations, and Markdown documentation.

### Production Build & Deployment

```bash
npm run build
```

The production command compiles the standalone static Angular application into:

```text
dist/resume/browser/
```

The emitted artifacts are completely static and host-neutral, optimized for CDN distribution (e.g., DigitalOcean App Platform, Cloudflare Pages, S3/CloudFront) without requiring server-side rendering, runtime APIs, or backend route rewriting.
