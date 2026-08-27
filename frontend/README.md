### Frontend Architecture

The frontend uses a reusable component-based React architecture.

Each major feature is separated into independent components, with
component-specific CSS files colocated with their JSX files.

Example:

```text
Portfolio/
├── Portfolio.jsx
├── Portfolio.css
└── components/
    ├── ProfileHeader/
    │   ├── ProfileHeader.jsx
    │   └── ProfileHeader.css
    │
    └── ProfessionalSummary/
        ├── ProfessionalSummary.jsx
        └── ProfessionalSummary.css