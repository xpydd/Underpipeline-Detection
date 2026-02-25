# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Pipeline Detection Management System** (管网智慧探测系统) - a multi-modal intelligent detection system for underground pipeline networks. It's a static HTML/CSS/JavaScript application with no build process, designed for direct deployment to web servers or OSS (Object Storage Service).

**Tech Stack:**
- Pure HTML5 with inline JavaScript
- TailwindCSS (via CDN)
- Google Material Symbols icons
- Vanilla JavaScript (ES6+)
- No framework, no build tools, no package.json

## Project Structure

```
/
├── index.html                    # Login page (entry point)
├── project-management.html       # Main project list/management
├── project-detail.html          # Individual project details
├── project-data.html            # Project data view
├── project-exploration.html     # Project exploration interface
├── project-model.html           # Project modeling
├── project-report.html          # Project reports
├── owner-management.html        # Owner/client management
├── owner-detail.html            # Owner details
├── dictionary-management.html   # System dictionary/settings
├── knowledge-center.html        # Knowledge base
├── js/
│   ├── config.js               # Global path configuration (CRITICAL)
│   ├── navigation.js           # Navigation menu manager
│   └── project-navigation.js   # Project-specific navigation
└── assets/
    ├── css/                    # Atomic CSS structure
    │   ├── atoms/              # Basic UI elements
    │   ├── molecules/          # Component combinations
    │   ├── organisms/          # Complex components
    │   ├── templates/          # Page templates
    │   ├── pages/              # Page-specific styles
    │   └── common.css          # Shared styles
    ├── js/
    │   ├── main.js             # Main application logic
    │   ├── theme.js            # Dark mode toggle
    │   ├── modules/            # Feature modules
    │   ├── ui/                 # UI components
    │   └── utils/              # Utility functions
    └── icons/                  # Icon assets
```

## Architecture Patterns

### 1. Path Resolution System (CRITICAL)

The application uses a custom path resolution system in `js/config.js` to handle deployment in subdirectories (especially for OSS/CDN deployment):

- **`CONFIG.getBaseUrl()`**: Auto-detects the base URL by looking for "Underpipeline-Detection" in the path
- **`CONFIG.resolvePath(path)`**: Converts relative/absolute paths to work in any deployment context
- **`CONFIG.navigateTo(path)`**: Safe navigation that respects the base URL

**When adding new pages or links:**
```javascript
// ALWAYS use CONFIG for navigation
window.APP_CONFIG.navigateTo('project-management.html');

// Or for href attributes, let NavigationManager fix them automatically
// It will call CONFIG.resolvePath() on all .nav-link elements
```

### 2. Navigation System

**NavigationManager** (`js/navigation.js`) handles:
- Active menu state synchronization
- In-page section switching (for multi-section pages)
- Hash-based routing
- Automatic link path correction using CONFIG

**Menu identification:**
- Each page belongs to a menu category: `project`, `owner`, `workbench`, `knowledge`, `system`, `tools`
- Set via `data-menu` attribute on nav links
- Automatically detected from pathname or hash

### 3. Page Structure Pattern

All pages follow this structure:
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <script src="js/config.js"></script> <!-- ALWAYS load config first -->
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined..." />
    <script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        primary: "#5ad98b",
                        "background-light": "#f6f8f7",
                        "background-dark": "#131f18"
                    }
                }
            }
        };
    </script>
</head>
<body>
    <!-- Page content -->
    <script src="js/navigation.js"></script> <!-- Load navigation manager -->
</body>
</html>
```

### 4. CSS Architecture (Atomic Design)

The CSS follows atomic design principles:
- **atoms/**: Basic elements (buttons, inputs, badges)
- **molecules/**: Simple component groups (form fields, cards)
- **organisms/**: Complex components (headers, tables, modals)
- **templates/**: Page layouts
- **pages/**: Page-specific overrides

**Note:** TailwindCSS is used via CDN for most styling. Custom CSS is minimal and focused on animations, transitions, and component-specific styles.

## Development Workflow

### Running the Application

**No build process required.** Simply open HTML files in a browser:

```bash
# Option 1: Direct file access
open index.html

# Option 2: Local server (recommended for testing path resolution)
python -m http.server 8000
# Then visit: http://localhost:8000/index.html

# Option 3: Using PHP
php -S localhost:8000

# Option 4: Using Node.js http-server
npx http-server -p 8000
```

### Testing Path Resolution

To test OSS subdirectory deployment locally:
```bash
# Create a subdirectory structure
mkdir -p test-deploy/Underpipeline-Detection
cp -r * test-deploy/Underpipeline-Detection/
cd test-deploy
python -m http.server 8000
# Visit: http://localhost:8000/Underpipeline-Detection/index.html
```

### Making Changes

1. **Adding a new page:**
   - Create HTML file in root directory
   - Include `js/config.js` in `<head>`
   - Add navigation links with `data-menu` attribute
   - Use `CONFIG.navigateTo()` for all internal links

2. **Modifying navigation:**
   - Edit `js/navigation.js` for global nav behavior
   - Edit `js/project-navigation.js` for project-specific nav
   - Update menu mappings in `getMenuFromPath()` if adding new pages

3. **Styling changes:**
   - Prefer TailwindCSS utility classes
   - Add custom CSS to appropriate atomic level in `assets/css/`
   - Use CSS variables defined in `assets/css/variables.css`

4. **JavaScript features:**
   - Add reusable utilities to `assets/js/utils/`
   - Add UI components to `assets/js/ui/`
   - Add feature modules to `assets/js/modules/`

## Key Technical Details

### Color Scheme
- Primary: `#5ad98b` (emerald green)
- Background Light: `#f6f8f7`
- Background Dark: `#131f18`
- Supports dark mode via `class="dark"` on `<html>`

### Icons
- Uses Google Material Symbols Outlined
- Icon syntax: `<span class="material-symbols-outlined">icon_name</span>`

### Responsive Breakpoints
- Mobile: < 768px (icons only in nav)
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Browser Support
- Modern browsers with ES6+ support
- No IE11 support required

## Common Pitfalls

1. **Forgetting to load config.js first** - Always load `js/config.js` before any navigation code
2. **Hardcoding paths** - Use `CONFIG.navigateTo()` or `CONFIG.resolvePath()` instead of direct `window.location.href`
3. **Not testing subdirectory deployment** - The app must work in both root and subdirectory contexts
4. **Breaking navigation state** - Ensure new pages have correct `data-menu` attributes on nav links

## Deployment

The application is designed for static hosting:
- **OSS/CDN**: Works in subdirectories (e.g., `/Underpipeline-Detection/`)
- **Web Server**: Can be deployed to root or any subdirectory
- **File Protocol**: Works with `file://` URLs for local testing

No build step required - just upload all files maintaining the directory structure.
