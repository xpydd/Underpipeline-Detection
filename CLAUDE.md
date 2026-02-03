# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**管网多模态全过程智慧探测系统** (Underground Pipeline Multi-modal Intelligent Detection System) - A web-based management system for underground pipeline detection projects. This is a frontend-only application built with vanilla HTML, CSS, and JavaScript.

## Technology Stack

- **Frontend Framework**: Vanilla JavaScript (ES6 modules)
- **Styling**:
  - Tailwind CSS v3 (via CDN)
  - Inline `<style>` blocks in HTML for custom animations and component-specific styles
- **Icons**: Material Symbols Outlined (Google Fonts)
- **Storage**: localStorage for client-side data persistence
- **Server**: Any static file server (e.g., `python -m http.server`, VS Code Live Server)
- **No Build Process**: Zero-build setup, just open HTML files in browser

## Commands

### Development
```bash
# Start local development server
python -m http.server 8000

# OR use VS Code Live Server extension
# OR open HTML files directly in browser
```

### Accessing the Application
Navigate to:
- `http://localhost:8000/index.html` - Main dashboard
- `http://localhost:8000/project-management.html` - Project list
- Any other HTML file in the root directory

## Project Structure

```
Underpipeline-Detection/
├── *.html                     # 10 application pages in root directory
├── js/
│   ├── project-navigation.js  # Project ID routing utilities
│   └── navigation.js          # General navigation utilities
└── assets/
    └── js/
        ├── main.js           # Main entry point, module initialization
        ├── theme.js          # Dark mode toggle
        ├── modules/          # Feature modules (class-based)
        │   ├── coordinateInput.js   # Coordinate data management
        │   ├── pointSearch.js       # Pipeline point search
        │   ├── radarScan.js         # GPR radar scanning
        │   └── surveyIssues.js      # Survey issue tracking
        ├── utils/            # Utility functions
        │   ├── dom.js        # DOM manipulation helpers
        │   ├── format.js     # Data formatting
        │   ├── modal.js      # Modal dialog utilities
        │   ├── storage.js    # localStorage wrapper
        │   └── validation.js # Input validation
        └── ui/               # UI-specific utilities
            ├── icons.js      # Icon management
            ├── contrast-report.js  # Accessibility contrast checking
            └── perf-metrics.js     # Performance monitoring
```

## Key Pages

All pages are located in the project root directory:

- **index.html**: Dashboard with project overview, owner information, and system settings
- **project-management.html**: Project list and management
- **project-detail.html**: Detailed project view with tabbed navigation (requires `?id=` parameter)
- **project-data.html**: Project data management (requires `?id=` parameter)
- **project-exploration.html**: Field exploration and survey tools (requires `?id=` parameter)
- **project-model.html**: 3D pipeline models (requires `?id=` parameter)
- **project-report.html**: Report generation (requires `?id=` parameter)
- **owner-management.html**: Owner/client management
- **owner-detail.html**: Owner details (requires `?id=` parameter)
- **dictionary-management.html**: System dictionary/configuration

## Architecture Patterns

### JavaScript Module System
The application uses ES6 modules with a centralized initialization pattern:

- **Entry Point**: `assets/js/main.js` imports all modules and exposes them to `window` object
- **Module Pattern**: Class-based modules (e.g., `PointSearchModule`, `RadarScanModule`)
- **Global Functions**: Attached to `window` for HTML onclick handlers
- **Initialization**: DOMContentLoaded event in `main.js` initializes all modules

### Project Navigation
- Project pages use URL query parameters (`?id=PROJ-2024-001`) to identify projects
- `js/project-navigation.js` provides utilities for:
  - Extracting project ID from URL: `getCurrentProjectId()`
  - Building project URLs: `buildProjectUrl(baseUrl, projectId)`
  - Updating all project links on page load: `updateProjectLinks()`

### Data Storage
- All data is stored in browser localStorage (no backend)
- Storage utilities in `assets/js/utils/storage.js`:
  - `saveToLocal(key, value)` - Save JSON data
  - `getFromLocal(key, defaultValue)` - Retrieve JSON data
  - `removeFromLocal(key)` - Delete data
  - `clearLocal()` - Clear all data

### Dark Mode
- Implemented using Tailwind's `dark:` class variants
- State stored in localStorage as `darkMode` key
- Toggle function: `window.toggleDarkMode()` (defined in `assets/js/main.js`)
- Initialized on page load via `initDarkMode()` in DOMContentLoaded
- Dark mode classes applied directly in HTML (e.g., `dark:bg-gray-800`)

## Design System

### Colors (Tailwind Config)
Defined in inline `<script id="tailwind-config">` in each HTML file:
- **Primary**: `#5ad98b` (green) - Used for CTAs, links, highlights
- **Background Light**: `#f6f8f7`
- **Background Dark**: `#131f18`

### Typography
- **Font Family**: Inter, PingFang SC, Microsoft YaHei, sans-serif
- **Language**: Chinese (Simplified) - zh-CN

### Status Indicators
- 实施中 (In Progress): Green dot with pulse animation
- 超期 (Overdue): Orange dot
- 超期完成 (Completed Late): Emerald dot
- 停工 (Suspended): Amber dot
- 终止 (Terminated): Red dot

## Development Workflow

### Making Changes

**HTML Files**:
- Edit files directly in root directory (`*.html`)
- Each HTML file includes inline Tailwind config in `<head>`
- Material Icons loaded via Google Fonts CDN
- Custom styles in inline `<style>` blocks

**CSS Styles**:
- **Primary Method**: Use Tailwind utility classes inline (e.g., `class="bg-primary text-white p-4"`)
- **Custom Styles**: Add to inline `<style>` blocks in HTML for animations, component-specific styles
- No build process needed - just refresh browser

**JavaScript**:
- Edit modules in `assets/js/modules/` or utilities in `assets/js/utils/`
- No compilation needed - refresh browser to see changes
- Modules must be imported in `assets/js/main.js` to be available globally

### Testing
- Manual testing in browser (no automated test suite)
- Test in both light and dark modes
- Verify localStorage persistence across page reloads
- Test project navigation with URL parameters (`?id=PROJ-2024-001`)

## Common Tasks

### Adding a New Page
1. Create HTML file in root directory
2. Copy header structure from existing page (e.g., `index.html`)
3. Include required scripts in `<head>`:
   ```html
   <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
   <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
   ```
4. Copy inline Tailwind config from `index.html` (the `<script id="tailwind-config">` block)
5. If page is project-specific, include `<script src="js/project-navigation.js"></script>` in `<head>`
6. Link from navigation or dashboard using relative paths (e.g., `href="new-page.html"`)

### Adding a New Module
1. Create module file in `assets/js/modules/` (e.g., `myFeature.js`)
2. Export class or object with methods:
   ```javascript
   export const myFeature = {
     init() { /* ... */ },
     doSomething() { /* ... */ }
   };
   ```
3. Import in `assets/js/main.js`:
   ```javascript
   import { myFeature } from './modules/myFeature.js';
   ```
4. Expose to `window` object for HTML onclick handlers:
   ```javascript
   window.myFeature = myFeature;
   window.doSomething = () => myFeature.doSomething();
   ```
5. Initialize in DOMContentLoaded event if needed:
   ```javascript
   document.addEventListener('DOMContentLoaded', function() {
     myFeature.init();
   });
   ```

### Adding Custom CSS Styles
1. **For simple styles**: Add to inline `<style>` block in the HTML file
   ```html
   <style>
     .my-custom-class {
       /* your styles */
     }
   </style>
   ```

2. **For reusable styles**: Use Tailwind utility classes or add to the Tailwind config
   ```javascript
   tailwind.config = {
     theme: {
       extend: {
         colors: {
           'my-color': '#hexcode'
         }
       }
     }
   };
   ```

### Working with Project Context
When building project-related features:
- Always extract project ID using `getCurrentProjectId()` from `js/project-navigation.js`
- Pass project ID between pages using `buildProjectUrl(baseUrl, projectId)`
- Call `updateProjectLinks()` on page load to automatically add `?id=` to all project links
- Update breadcrumbs and page titles dynamically based on project ID
- Store project-specific data in localStorage with project ID as key prefix (e.g., `PROJ-2024-001_data`)

## Important Notes

- **No Backend**: All data is mocked or stored in localStorage
- **CDN Dependencies**: Tailwind CSS and Google Fonts loaded from CDN
- **Browser Compatibility**: Modern browsers only (ES6 modules required)
- **Chinese Interface**: All UI text is in Chinese (Simplified)
- **Responsive Design**: Mobile-friendly using Tailwind responsive classes
