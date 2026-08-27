### Responsive Design

The dashboard is designed for:

- Desktop
- Tablet
- Mobile

The sidebar remains visible on desktop and transforms into an off-canvas navigation drawer on smaller screens.

### Current Architecture

```text
React Application
│
├── DashboardLayout
│   ├── Sidebar
│   ├── Header
│   └── Outlet
│
└── Pages
    ├── Dashboard
    ├── Portfolio
    ├── Projects
    └── Experience
```

## Quick Actions Component

The Dashboard Quick Actions feature is implemented as a reusable React
component.

### Responsibilities

The `QuickActions` component:

- Displays available dashboard shortcuts
- Receives action definitions through props
- Handles navigation using React Router
- Supports optional callback functions
- Uses responsive styling for desktop, tablet, and mobile layouts

### Action Structure

Each action contains:

```js
{
  id: "add-project",
  label: "Add Project",
  icon: "+",
  path: "/projects/new"
}
```

## PublicPortfolioCard Component

The `PublicPortfolioCard` is a reusable dashboard component that
provides the authenticated user with access to their public portfolio.

### Responsibilities

The component:

- Displays the user's public portfolio URL
- Displays the current portfolio status
- Allows the user to copy their public portfolio URL
- Provides navigation to the public portfolio
- Supports live/offline portfolio states
- Provides responsive desktop, tablet, and mobile layouts

### Props

| Prop          | Type    | Description                                            |
| ------------- | ------- | ------------------------------------------------------ |
| `username`    | string  | Unique public portfolio identifier                     |
| `isLive`      | boolean | Determines whether the portfolio is publicly available |
| `platformUrl` | string  | Base URL of the portfolio platform                     |

### Public URL Structure

Public portfolios use the following URL structure:

`/u/:username`

Example:

`yourplatform.com/u/jeanjoseph56`

### Component Responsibilities

The component is responsible only for presentation and user
interaction.

It does not directly communicate with MSSQL.

Future data flow:

User Interface → API Service → Backend → MSSQL

### Future Integration

The hard-coded username used during development will eventually be
replaced with the authenticated user's profile data retrieved from
the backend.

The public portfolio route will use React Router's dynamic route
parameter:

`/u/:username`

The public portfolio page will then request the corresponding
profile from the backend API.

Dashboard
│
├── WelcomeCard
│
├── Statistics
│ └── StatisticCard
│
├── ProfileCompletion
│ └── CompletionItem
│
├── QuickActions
│
├── PublicPortfolioCard ← we are finishing this now
│
└── RecentActivity

### RecentActivity

**Location:**

`src/pages/Dashboard/components/RecentActivity/`

**Files:**

- `RecentActivity.jsx`
- `RecentActivity.css`

**Purpose:**

The `RecentActivity` component displays recent actions performed
within the user's portfolio platform.

**Responsibilities:**

- Display recent portfolio activity
- Display activity title and description
- Display activity timestamp
- Display the number of recent activities
- Provide an empty state when no activity exists
- Provide responsive layouts for desktop, tablet, and mobile devices

**Props:**

| Prop         | Type  | Description                          |
| ------------ | ----- | ------------------------------------ |
| `activities` | Array | Collection of recent user activities |

**Activity Object:**

Each activity currently contains:

- `id`
- `title`
- `description`
- `time`

A future implementation may additionally include:

- `dateTime`
- `type`
- `icon`
- `userId`
- `createdAt`

**Architecture:**

The component is presentation-focused and does not directly access
the database.

Future activity data will be retrieved through the backend API.

Future data flow:

MSSQL  
→ Backend API  
→ API Service  
→ Dashboard  
→ RecentActivity

**Responsive Behavior:**

Desktop:
Activity timestamp is displayed.

Tablet:
Activity descriptions can wrap when necessary.

Mobile:
Activity timestamps are hidden to preserve space and readability.

# Component Architecture

## My Portfolio Page

The My Portfolio page is designed using a modular React component architecture.

The page itself is responsible for composing the different portfolio
functionalities rather than containing all profile-related UI directly.

### Current Structure

```text
Portfolio/
├── Portfolio.jsx
├── Portfolio.css
└── components/
    └── ProfileHeader/
        ├── ProfileHeader.jsx
        └── ProfileHeader.css

Portfolio/
├── Portfolio.jsx
├── Portfolio.css
└── components/
    ├── PortfolioPageHeader/
    │   ├── PortfolioPageHeader.jsx
    │   └── PortfolioPageHeader.css
    │
    ├── ProfileHeader/
    │   ├── ProfileHeader.jsx
    │   └── ProfileHeader.css
    │
    ├── ProfessionalSummary/
    │   ├── ProfessionalSummary.jsx
    │   └── ProfessionalSummary.css
    │
    ├── ExperienceSection/
    │   ├── ExperienceSection.jsx
    │   └── ExperienceSection.css
    │
    ├── EducationSection/
    │   ├── EducationSection.jsx
    │   └── EducationSection.css
    │
    ├── SkillsSection/
    │   ├── SkillsSection.jsx
    │   └── SkillsSection.css
    │
    └── SocialLinks/
        ├── SocialLinks.jsx
        └── SocialLinks.css

### ProfileHeader

The ProfileHeader component manages the primary professional identity
information displayed at the top of the portfolio.

Current responsibilities:

- Display profile identity
- Display professional title
- Display location
- Display contact information
- Display website
- Display LinkedIn
- Toggle between read-only and edit modes
- Validate/edit profile fields at the UI level
- Prepare profile data for future API integration

Component structure:

```text
ProfileHeader/
├── ProfileHeader.jsx
└── ProfileHeader.css