# **1. Project Overview**

تلاقي منصة رقمية تساعد المستخدمين على اكتشاف فرص التعلم والتدريب، والتعبير عن المهارات التي يرغبون في اكتسابها.

## **2. Tech Stack**

**Frontend:** Next.js 16 (App Router), TS, Tailwind CSS, React Hook Form, TanStack Query, Axios, Lucide React

**Backend:** Next.js Route Handlers (API), JWT Authentication, bcryptjs, Zod

**Database:** MongoDB, Mongoose ODM

**Other**

- Google Gemini API — AI Processing
- Vercel Blob — File Storage
- Firebase — Integration
- Vercel — Hosting & Deployment
- Vercel Analytics — Usage Analytics
- Vercel Speed Insights — Performance Monitoring
- pnpm — Package Manager

### **3. File System / Project Structure**

المشروع يستخدم بنية Next.js App Router، مع فصل صفحات التطبيق وواجهاته ومكتباته ونماذج قاعدة البيانات.

```

talaqi/
│
├── public/
│   └── Static assets, images, icons, fonts
│
├── scripts/
│   └── Database and utility scripts
│
├── src/
│   │
│   ├── app/
│   │   ├── (public)/
│   │   │   └── Public pages and user-facing routes
│   │   │
│   │   ├── admin/
│   │   │   └── Admin dashboard pages
│   │   │
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── student/
│   │   │   ├── ai/
│   │   │   └── Other API routes
│   │   │
│   │   ├── landing/
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   └── not-found.tsx
│   │
│   ├── components/
│   │   ├── admin/
│   │   ├── centers/
│   │   ├── courses/
│   │   ├── dashboard/
│   │   ├── forms-client/
│   │   ├── providers/
│   │   ├── charts/
│   │   ├── table/
│   │   ├── theme/
│   │   ├── ui/
│   │   └── Element/
│   │
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── auth.ts
│   │   ├── blob.ts
│   │   ├── db.ts
│   │   ├── gemini.ts
│   │   ├── rate-limit.ts
│   │   ├── security.ts
│   │   ├── utils.ts
│   │   └── wa.ts
│   │
│   ├── models/
│   │   ├── User.ts
│   │   ├── UserDetails.ts
│   │   ├── Course.ts
│   │   ├── Organization.ts
│   │   ├── DefCourse.ts
│   │   ├── Section.ts
│   │   ├── Slider.ts
│   │   └── waInit.ts
│   │
│   └── static/
│       └── Static JSON data
│
├── package.json
├── pnpm-lock.yaml
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── components.json
└── README.md

```