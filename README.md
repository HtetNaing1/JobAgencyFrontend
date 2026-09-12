# Job Agency System - Frontend

Web client for the Job Agency System, a platform that connects job seekers, employers, and training centers. Built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4.

Backend repository: https://github.com/HtetNaing1/JobAgencyBackend

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features by Role](#features-by-role)
- [Project Structure](#project-structure)
- [Route Map](#route-map)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Architecture](#architecture)
- [UI Component Library](#ui-component-library)
- [Styling](#styling)
- [Deployment](#deployment)

---

## Overview

The application is a single Next.js App Router project that serves four distinct user experiences from one codebase. After signing in, users are routed to a dashboard matching their role, and every protected page enforces its own role requirement on the client.

| Role | Landing dashboard |
| --- | --- |
| Job seeker | `/dashboard/jobseeker` |
| Employer | `/dashboard/employer` |
| Training center | `/dashboard/training-center` |
| Admin | `/dashboard/admin` |

All data comes from the backend REST API. There is no server-side data layer in this project.

---

## Tech Stack

| Concern | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| UI library | React 19 |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 4 with the PostCSS plugin |
| HTTP client | Axios with request and response interceptors |
| State | React Context (authentication and notifications) |
| Fonts | Geist Sans and Geist Mono through `next/font` |
| Linting | ESLint 9 with `eslint-config-next` |

---

## Features by Role

### Public visitors
- Marketing landing page with platform statistics and calls to action
- Job search and filtering with a detail page for every posting
- Company directory and public company profiles
- Training course catalogue and training center directory
- Registration, login, forgot password, reset password, and email verification flows

### Job seekers
- Guided profile setup covering personal details, skills, experience, and education
- Resume upload and management
- Profile photo upload
- Job applications with resume and cover letter attachments
- Application tracking with pipeline status and employer feedback
- Personalized job recommendations driven by the backend match score
- Bookmarks for both jobs and courses
- Course inquiries and an inquiry tracking page
- Account settings including password change and account deletion

### Employers
- Company profile setup with logo and cover image upload
- Job posting creation and editing
- Job management with draft, active, paused, and closed states
- Applicant review across all postings or filtered to a single job
- Status updates individually or in bulk
- Interview scheduling and structured candidate feedback
- Applicant profile viewing

### Training centers
- Center profile setup with logo upload
- Course creation, editing, and deletion
- Course catalogue management
- Inquiry inbox with status tracking
- Dashboard statistics

### Administrators
- Platform dashboard with user, job, application, and course counts
- User management with activation, deactivation, and deletion
- Job moderation with status changes and removal
- Training center verification
- Analytics view

### Cross-cutting
- In-app notification centre with an unread badge in the navigation bar, polled every 30 seconds
- Role-aware navigation and dashboard shell
- Loading skeletons, spinners, empty states, and alerts throughout
- Responsive layouts from mobile through desktop

---

## Project Structure

```
frontend/
├── src/
│   ├── app/                       App Router pages
│   │   ├── layout.tsx             Root layout, fonts, providers, navbar
│   │   ├── page.tsx               Landing page
│   │   ├── globals.css            Tailwind import, theme tokens, animations
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   ├── verify-email/
│   │   ├── jobs/                  Browse, detail, post, edit
│   │   ├── companies/[id]/
│   │   ├── training/              Courses, course detail, centers
│   │   ├── training-centers/[id]/
│   │   ├── applications/
│   │   ├── bookmarks/
│   │   ├── my-courses/
│   │   ├── notifications/
│   │   ├── profile/               Setup, resume, photo, company
│   │   ├── settings/
│   │   └── dashboard/             Per-role dashboards
│   ├── components/
│   │   ├── Navbar.tsx             Role-aware top navigation
│   │   ├── DashboardLayout.tsx    Shared dashboard shell
│   │   ├── ProtectedRoute.tsx     Client-side auth and role guard
│   │   ├── NotificationBell.tsx   Unread badge and dropdown
│   │   ├── BookmarkButton.tsx     Reusable bookmark toggle
│   │   └── ui/                    Shared primitives
│   ├── contexts/
│   │   ├── AuthContext.tsx        Session state and auth actions
│   │   └── NotificationContext.tsx Notification state and polling
│   └── lib/
│       └── api.ts                 Axios instance and typed API helpers
├── public/
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── postcss.config.mjs
```

---

## Route Map

### Public

| Route | Description |
| --- | --- |
| `/` | Landing page |
| `/jobs` | Job search and filters |
| `/jobs/[id]` | Job detail and apply |
| `/companies/[id]` | Company profile |
| `/training` | Course catalogue |
| `/training/[id]` | Course detail and inquiry |
| `/training/centers/[id]` | Training center profile |
| `/training-centers/[id]` | Training center profile |
| `/login` | Sign in |
| `/register` | Create an account |
| `/forgot-password` | Request a reset link |
| `/reset-password` | Set a new password |
| `/verify-email` | Confirm an email address |

### Job seeker

| Route | Description |
| --- | --- |
| `/dashboard/jobseeker` | Overview and recommendations |
| `/profile` | Profile |
| `/profile/setup` | Guided profile setup |
| `/profile/resume` | Resume upload and management |
| `/profile/photo` | Profile photo upload |
| `/applications` | Application tracking |
| `/bookmarks` | Saved jobs and courses |
| `/my-courses` | Course inquiries |

### Employer

| Route | Description |
| --- | --- |
| `/dashboard/employer` | Overview |
| `/dashboard/employer/jobs` | Job management |
| `/dashboard/employer/applications` | Applicant pipeline |
| `/dashboard/employer/profile` | Company profile |
| `/profile/company/setup` | Company profile setup |
| `/jobs/post` | Create a job posting |
| `/jobs/edit/[id]` | Edit a job posting |

### Training center

| Route | Description |
| --- | --- |
| `/dashboard/training-center` | Overview |
| `/dashboard/training-center/courses` | Course management |
| `/dashboard/training-center/courses/new` | Create a course |
| `/dashboard/training-center/courses/[id]/edit` | Edit a course |
| `/dashboard/training-center/inquiries` | Inquiry inbox |
| `/dashboard/training-center/profile` | Center profile |
| `/dashboard/training-center/profile/setup` | Center profile setup |

### Admin

| Route | Description |
| --- | --- |
| `/dashboard/admin` | Platform dashboard |
| `/dashboard/admin/users` | User management |
| `/dashboard/admin/jobs` | Job moderation |
| `/dashboard/admin/training-centers` | Center verification |
| `/dashboard/admin/analytics` | Analytics |

### Shared authenticated

| Route | Description |
| --- | --- |
| `/notifications` | Notification centre |
| `/settings` | Account settings |

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- A running instance of the Job Agency backend API

### Installation

```bash
git clone https://github.com/HtetNaing1/JobAgencyFrontend.git
cd JobAgencyFrontend
npm install
```

Create `.env.local` in the project root:

```
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

Then start the development server:

```bash
npm run dev
```

Open http://localhost:3000.

The backend must be running and reachable at `NEXT_PUBLIC_API_URL`, and its `FRONTEND_URL` must be set to this origin so that CORS permits the requests.

### Demo accounts

If the backend database has been seeded with `npm run seed`, every demo account uses the password `Test1234!`.

| Role | Email |
| --- | --- |
| Admin | `admin@jobagency.com` |
| Employer | `hr@techcorp.com` |
| Job seeker | `john.doe@email.com` |
| Training center | `info@techacademy.com` |

---

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes | Base URL of the backend API including the `/api` suffix. Falls back to `http://localhost:5001/api` if unset, which matches the backend default port. |

The `NEXT_PUBLIC_` prefix means this value is inlined into the client bundle, so it must not hold anything secret.

---

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server on port 3000. |
| `npm run build` | Create a production build. |
| `npm start` | Serve the production build. |
| `npm run lint` | Run ESLint. |

---

## Architecture

### API layer

`src/lib/api.ts` exports a configured Axios instance plus grouped helper objects such as `authApi`. Two interceptors handle the cross-cutting concerns:

- **Request** - attaches `Authorization: Bearer <token>` from `localStorage` when a token is present, and strips the `Content-Type` header for `FormData` payloads so the browser can set the multipart boundary itself.
- **Response** - on a `401`, clears the stored token and user and redirects to `/login`. Login and register responses are exempt so that the forms can display their own validation errors, and the redirect is skipped if the user is already on the login page.

### Authentication

`AuthContext` owns the session. On mount it restores the token and user from `localStorage`, then revalidates against `GET /auth/me`. If that call fails the stored session is cleared. The context exposes `user`, `token`, `loading`, `isAuthenticated`, `login`, `register`, and `logout`.

`ProtectedRoute` wraps pages that require a session. It waits for the initial auth check to finish, redirects unauthenticated visitors to `/login`, and redirects users whose role is not in `allowedRoles` to their own dashboard. A spinner is shown while the check is in flight, and nothing is rendered when access is denied.

### Notifications

`NotificationContext` loads notifications for signed-in users and polls the unread count every 30 seconds. It exposes `notifications`, `unreadCount`, `loading`, `fetchNotifications`, `markAsRead`, `markAllAsRead`, and `deleteNotification`. `NotificationBell` in the navigation bar consumes the unread count.

### Providers

Both providers are mounted once in `src/app/layout.tsx`, with `NotificationProvider` nested inside `AuthProvider` because it depends on authentication state. The shared `Navbar` renders above every page.

### Path aliases

`@/*` maps to `./src/*`, so imports read as `@/components/ui` and `@/contexts/AuthContext` rather than long relative paths.

---

## UI Component Library

Shared primitives live in `src/components/ui` and are re-exported from a barrel file, so they can be imported together:

```tsx
import { Button, Card, Input, Badge } from '@/components/ui';
```

| Component | Purpose |
| --- | --- |
| `Alert` | Inline success, warning, and error messaging |
| `Avatar` | User and company image with fallback |
| `Badge` | Status pills for application and job states |
| `Breadcrumbs` | Hierarchical navigation |
| `Button` | Variants and sizes, used across all forms and actions |
| `Card` | Content container used by listings and dashboards |
| `Checkbox` | Form checkbox |
| `EmptyState` | Placeholder for empty lists |
| `Input` | Text input with label and error state |
| `Modal` | Dialog for confirmations and inline forms |
| `PasswordInput` | Password field with visibility toggle |
| `Progress` | Progress and completion indicators |
| `Select` | Dropdown select |
| `Skeleton` | Loading placeholder |
| `Spinner` | Loading indicator |
| `Tabs` | Tabbed sections in dashboards |
| `Textarea` | Multi-line input |
| `Tooltip` | Contextual hints |

Higher level shared components are `Navbar`, `DashboardLayout`, `ProtectedRoute`, `NotificationBell`, and `BookmarkButton`.

---

## Styling

Tailwind CSS 4 is imported directly in `src/app/globals.css` through `@import "tailwindcss"`, with no separate Tailwind config file. Theme tokens are declared in `:root` and exposed to Tailwind through an `@theme inline` block, which wires the Geist font variables and the background and foreground colours into the utility system.

`globals.css` also defines the custom animation set used on the landing page and across transitions, including fade in, fade in up, fade in down, float, staggered animation delays, gradient text, and gradient mesh backgrounds.

---

## Deployment

The project is a standard Next.js application and deploys without modification to Vercel or any Node hosting platform.

1. Build with `npm run build` and serve with `npm start`, or connect the repository to Vercel.
2. Set `NEXT_PUBLIC_API_URL` to the deployed backend API URL in the hosting environment. It must be set at build time, not only at runtime, because it is inlined into the client bundle.
3. Set `FRONTEND_URL` on the backend to the deployed frontend origin so that CORS allows the requests.

Environment files, `node_modules`, `.next`, and TypeScript build info are excluded from version control.

---

## Author

Htet Naing
