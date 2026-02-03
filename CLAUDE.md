# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**管网多模态全过程智慧探测系统** (Underground Pipeline Multi-modal Intelligent Detection System) - A web-based management system for underground pipeline detection projects. This is a frontend-only application built with vanilla HTML, CSS, and JavaScript using Tailwind CSS for styling.

## Technology Stack

- **Frontend Framework**: Vanilla JavaScript (ES6 modules)
- **Styling**: Tailwind CSS (via CDN)
- **Icons**: Material Symbols Outlined (Google Fonts)
- **Storage**: localStorage for client-side data persistence
- **No Build Process**: Direct browser execution, no compilation required

## Project Structure

```
Underpipeline-Detection/
├── index.html                 # Main dashboard/homepage
├── *.html                     # All application pages (11 pages total)
├── js/
│   └── project-navigation.js  # Project ID routing utilities
├── assets/
│   ├── css/
│   │   └── common.css        # Custom CSS variables and animations
│   └── js/
│       ├── main.js           # Main entry point, module initialization
│       ├── modules/          # Feature modules
│       │   ├── coordinateInput.js   # Coordinate data management
│       │   ├── pointSearch.js       # Pipeline point search
│       │   ├── radarScan.js         # GPR radar scanning
│       │   └── surveyIssues.js      # Survey issue tracking
│       └── utils/            # Utility functions
│           ├── dom.js        # DOM manipulation helpers
│           ├── format.js     # Data formatting
│           ├── modal.js      # Modal dialog utilities
│           ├── storage.js    # localStorage wrapper
│           └── validation.js # Input validation
```

## Key Pages

All pages are located in the project root directory:

- **index.html**: Dashboard with project overview, owner information, and system settings
- **project-management.html**: Project list and management
- **project-detail.html**: Detailed project view with tabbed navigation
- **project-data.html**: Project data management
- **project-exploration.html**: Field exploration and survey tools
- **project-model.html**: 3D pipeline models
- **project-report.html**: Report generation
- **owner-management.html**: Owner/client management
- **owner-detail.html**: Owner details
- **dictionary-management.html**: System dictionary/configuration
- **enterprise-authorization-backup.html**: Enterprise authorization backup

## Architecture Patterns

### Module System
The application uses ES6 modules with a centralized initialization pattern:
- `assets/js/main.js` imports all modules and exposes them to `window` object
- Modules are class-based (e.g., `PointSearchModule`, `RadarScanModule`)
- Global functions are attached to `window` for HTML onclick handlers

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
- Toggle function: `window.toggleDarkMode()`
- Initialized on page load in `main.js`

## Design System

### Colors
- **Primary**: `#5ad98b` (green) - Used for CTAs, links, highlights
- **Background Light**: `#f6f8f7`
- **Background Dark**: `#131f18`
- **Card Dark**: `#161e27`

### Typography
- Font family: Inter, PingFang SC, Microsoft YaHei, sans-serif
- Chinese language interface (zh-CN)

### Status Indicators
- 实施中 (In Progress): Green dot with pulse animation
- 超期 (Overdue): Orange dot
- 超期完成 (Completed Late): Emerald dot
- 停工 (Suspended): Amber dot
- 终止 (Terminated): Red dot

## Development Workflow

### Running the Application
Since this is a static HTML/CSS/JS application with no build process:

1. **Local Development**: Open `index.html` directly in a browser, or use a local server:
   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js (if http-server is installed)
   npx http-server -p 8000
   ```

2. **Access**: Navigate to `http://localhost:8000/index.html`

### Making Changes
- **HTML**: Edit files directly in root directory (`*.html`)
- **Styles**: Modify Tailwind classes inline or add custom CSS to `assets/css/common.css`
- **JavaScript**: Edit modules in `assets/js/modules/` or utilities in `assets/js/utils/`
- **No compilation needed**: Refresh browser to see changes

### Testing
- Manual testing in browser (no automated test suite)
- Test in both light and dark modes
- Verify localStorage persistence across page reloads

## Common Tasks

### Adding a New Page
1. Create HTML file in root directory
2. Copy header structure from existing page (e.g., `project-detail.html`)
3. Include Tailwind config and Material Icons in `<head>`
4. If page is project-specific, include `<script src="js/project-navigation.js"></script>` in `<head>`
5. Link from navigation or dashboard using relative paths (e.g., `href="new-page.html"`)

### Adding a New Module
1. Create module file in `assets/js/modules/`
2. Export class with methods
3. Import in `assets/js/main.js`
4. Expose to `window` object for HTML access
5. Initialize in DOMContentLoaded event if needed

### Working with Project Context
When building project-related features:
- Always extract project ID using `getCurrentProjectId()` from URL
- Pass project ID between pages using `buildProjectUrl()`
- Update breadcrumbs and page titles dynamically
- Store project-specific data in localStorage with project ID as key prefix

## Important Notes

- **No Backend**: All data is mocked or stored in localStorage
- **CDN Dependencies**: Tailwind CSS and Google Fonts loaded from CDN
- **Browser Compatibility**: Modern browsers only (ES6 modules required)
- **Chinese Interface**: All UI text is in Chinese (Simplified)
- **Responsive Design**: Mobile-friendly using Tailwind responsive classes
