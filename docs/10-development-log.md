# Development Log

## Step 1 — Frontend Project Initialization

### Completed

- Created the React frontend using Vite.
- Installed React Router.
- Created the initial frontend project structure.
- Established a dark-first visual design system.
- Added global CSS variables for:
  - Colors
  - Typography
  - Borders
  - Border radius
  - Spacing
  - Transitions
  - Sidebar dimensions
  - Header dimensions

---

## Step 2 — Dashboard Foundation

### Completed

- Created the DashboardLayout component.
- Created the responsive Sidebar.
- Created the responsive Header.
- Added responsive navigation behavior.
- Added mobile hamburger navigation.
- Added mobile sidebar overlay.
- Added React Router `<Outlet />` for nested dashboard pages.
- Created the initial Dashboard page.
- Added dashboard statistics.
- Added profile completion indicator.
- Added quick actions.
- Added public portfolio URL preview.
- Added recent activity section.

---

# 12. Final Dashboard checklist

- [x] WelcomeCard component
- [x] Statistics component
- [x] StatisticCard component
- [x] ProfileCompletion component
- [x] QuickActions component
- [x] PublicPortfolioCard component
- [x] RecentActivity component
- [x] Component-specific CSS
- [x] Shared Dashboard CSS
- [x] Responsive desktop layout
- [x] Responsive tablet layout
- [x] Responsive mobile layout
- [x] Dashboard routing
- [x] Sidebar navigation
- [x] Header
- [x] Hamburger menu
- [x] Sidebar overlay
- [x] Documentation

### Things we should do

Our next major phase will be:

**Dashboard → My Portfolio → Portfolio Editor**

and then we'll progressively introduce:

```text
React
   ↓
API service layer
   ↓
Backend
   ↓
MSSQL
```

# Development Documentation

## 1. Project Foundation

### Frontend

The frontend was created using React with Vite.

Technology stack:

- React
- Vite
- React Router
- CSS
- JavaScript

The frontend is organized using a modular component-based architecture.

### Styling Architecture

CSS files are colocated with their corresponding React components.

Example:

```text
ProfileHeader/
├── ProfileHeader.jsx
└── ProfileHeader.css
```

## Portfolio Page – Initial Architecture

### Completed

- Created the My Portfolio page.
- Added the professional profile page header.
- Added Preview and Save Changes actions.
- Integrated the existing ProfileHeader component.
- Maintained the component-per-functionality architecture.
- Added responsive behavior for desktop, tablet, and mobile layouts.

### Architecture Decision

The Portfolio page will not contain all profile functionality directly.

Instead, each major profile section will be implemented as an independent
React component with its corresponding CSS file.

This approach will make the application easier to maintain and will allow
the same components to eventually consume data from the backend API and
Microsoft SQL Server.

### Next Step

Build and refine the ProfileHeader component as the first complete
portfolio-editing section.

## ProfileHeader Component

### Completed

- Created the ProfileHeader component.
- Added professional identity information.
- Added editable profile fields.
- Added read-only and edit modes.
- Added Save and Cancel actions.
- Added responsive desktop, tablet, and mobile styling.
- Kept JSX and CSS together within the component folder.
- Prepared the component's data structure for future backend integration.

### Current Data

The component currently uses local React state.

No database or API calls have been introduced yet.

### Next Step

Build the Professional Summary component as a separate reusable
portfolio component.
