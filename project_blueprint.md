# Project Blueprint: RentSafe (Final As-Built)

## 1. System Overview
**RentSafe** is a web application designed to verify car rental shops and report fraudulent activities in Thailand. It serves as a central platform for users to check rental shop credibility and for victims to report scams.

### Technology Stack
*   **Frontend**: Next.js 14 (App Router), TypeScript, React
*   **Styling**: Tailwind CSS, shadcn/ui (Radix UI based)
*   **Backend**: Supabase (PostgreSQL Database, Authentication, Storage)
*   **Internationalization**: `next-intl` (Thai/English support)
*   **State Management**: React Hooks, Server Actions
*   **Form Handling**: React Hook Form + Zod Validation

## 2. Project Structure
The project follows a standard Next.js App Router structure with feature-based component organization.

```
src/
├── app/                        # App Router Pages & Layouts
│   ├── [locale]/               # Internationalized Routes
│   │   ├── admin/              # Admin Dashboard & Management
│   │   ├── auth/               # Auth Callback Handler
│   │   ├── dashboard/          # User/Shop Dashboard
│   │   ├── login/              # Login Page
│   │   ├── register/           # User Registration (if separate)
│   │   ├── report/             # Fraud Reporting Page
│   │   ├── search/             # Search Results Page
│   │   ├── shop/               # Shop Public Profiles & Registration
│   │   ├── layout.tsx          # Root Layout (Navbar, Footer, Providers)
│   │   └── page.tsx            # Homepage (Hero, Dual Search)
│   └── globals.css             # Global Styles
├── components/                 # React Components
│   ├── features/               # Feature-specific Logic
│   │   ├── admin/              # Admin Sidebar & Widgets
│   │   ├── home/               # Hero Section
│   │   ├── report/             # Report Forms
│   │   ├── search/             # Search Logic & Results
│   │   └── shop/               # Shop Registration & Profile
│   ├── layout/                 # Shared Layout Components (Navbar, Footer)
│   └── ui/                     # Reusable UI Elements (Buttons, Inputs, etc.)
├── lib/                        # Utilities & Configurations
│   ├── constants/              # Static Data (Provinces, etc.)
│   ├── supabase/               # Supabase Client & Server Setup
│   └── utils.ts                # Helper Functions
└── middleware.ts               # i18n Routing Middleware
```

## 3. Database Schema (Supabase)
The system uses PostgreSQL with the following core tables:

### `profiles`
*   Stores user information linked to Supabase Auth.
*   **Fields**: `id` (UUID), `email`, `full_name`, `avatar_url`, `role` (user/admin), `created_at`.

### `shops`
*   Stores rental shop information.
*   **Fields**: `id`, `owner_id` (FK), `name`, `description`, `facebook_url`, `line_id`, `phone_number`, `website`, `service_provinces` (Array), `bank_account_no`, `bank_account_name`, `verification_status` (pending/verified/rejected).

### `reports`
*   Stores fraud reports submitted by users.
*   **Fields**: `id`, `reporter_id` (FK), `shop_id` (FK, optional), `manual_shop_name`, `manual_shop_contact`, `manual_bank_account`, `manual_id_card`, `description`, `evidence_urls` (Array), `incident_date`, `amount_lost`, `status` (pending/approved/rejected).

### `verifications`
*   Stores documents for shop verification.
*   **Fields**: `id`, `shop_id` (FK), `document_type`, `document_url`, `status`.

## 4. Key Features & Implementation

### A. Authentication
*   **Method**: Google OAuth & Email Magic Link (via Supabase).
*   **Implementation**: `src/app/[locale]/login/page.tsx`, `src/lib/supabase/auth`.
*   **Protection**: Middleware ensures protected routes (`/dashboard`, `/admin`) require login.

### B. Dual Search System
*   **Function**: Allows searching for "Verified Shops" (White List) and "Blacklisted Shops" (Black List).
*   **Implementation**: `HeroSection.tsx` (Tabs), `SearchResults.tsx` (Logic).
*   **Search Keys**: Shop Name, Province (for rentals), Bank Account, Phone, ID Card (for fraud).

### C. Shop Registration
*   **Function**: Allows users to register their rental business.
*   **Features**: Multi-select provinces, PDPA consent, Bank account locking.
*   **Implementation**: `ShopRegistrationForm.tsx`.

### D. Fraud Reporting
*   **Function**: Users report scams with evidence.
*   **Features**: 5MB Image Upload Limit, Liability Waiver, Auto-generated Reference IDs.
*   **Implementation**: `ReportForm.tsx`.

### E. Admin System
*   **Function**: Manage shops and reports.
*   **Features**: Dashboard Stats, Verification Queue, Report Moderation.
*   **Implementation**: `src/app/[locale]/admin/*`.

## 5. Configuration & Deployment

### Environment Variables (`.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Storage Buckets
Required public buckets in Supabase Storage:
1.  `shop-images`: For shop logos and banners.
2.  `report-evidence`: For slip/chat screenshots (Fraud reports).
3.  `verification-docs`: For ID cards/Business licenses (Shop verification).

### Deployment
1.  **Build**: `npm run build`
2.  **Start**: `npm start`
3.  **Platform**: Recommended Vercel for frontend, Supabase for backend.
