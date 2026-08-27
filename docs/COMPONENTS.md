## Experience Components

### Experience

**Location:**

`src/pages/Portfolio/components/Experience/`

**Responsibility:**

Manages the professional experience section of the portfolio editor.

The component receives an array of experience records and renders an `ExperienceItem` component for each record.

**Props:**

- `experiences` — array containing professional experience records.

---

### ExperienceItem

**Location:**

`src/pages/Portfolio/components/Experience/ExperienceItem/`

**Responsibility:**

Represents a single professional experience entry.

The component is reusable and does not manage the entire experience list.

**Props:**

- `jobTitle`
- `company`
- `location`
- `startDate`
- `endDate`
- `description`
- `current`

**Design:**

The component uses a vertical timeline layout to visually represent career progression.

---

### Component Relationship

```text
Portfolio
    │
    └── Experience
          │
          ├── ExperienceItem
          ├── ExperienceItem
          └── ExperienceItem