# Link Weaver Project Report

## Introduction
Link Weaver is a modern URL shortener web application built with React, TypeScript, and Vite. It allows users to create short links from long URLs, manage saved links through a dashboard, and control link privacy with authenticated access. The project also includes Supabase-backed authentication, database storage, and edge functions for shortening and redirecting links.

## Objective of the Project
The main objective of Link Weaver is to provide a fast, secure, and simple link-shortening platform. The application is designed to:

- Convert long URLs into compact short links.
- Support user authentication for managing personal links.
- Allow private URLs for signed-in users.
- Track and manage URL clicks from the dashboard.
- Provide a production-ready deployment path using containerization and a web server.

## Functionalities
The project currently provides the following functionalities:

- URL shortening through a Supabase Edge Function.
- Redirect handling for short URLs.
- User sign-up and sign-in with Supabase Auth.
- Dashboard to view, copy, and delete stored URLs.
- Private link support for authenticated users.
- Admin view to inspect all URLs when the user has admin privileges.
- Click count tracking and expiration handling for links.
- Responsive UI built with reusable component primitives.

## Tech Stack Used

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- TanStack React Query
- Tailwind CSS
- shadcn/ui style components powered by Radix UI
- Lucide React icons
- Sonner toast notifications

### Backend and Data
- Supabase Authentication
- Supabase PostgreSQL database
- Supabase Edge Functions
- Row Level Security policies
- Database migrations and SQL functions

### Testing and Quality
- Vitest
- Testing Library
- ESLint

### Deployment and Runtime
- Docker
- Nginx

## Software Requirements
To develop or run this project, the following software is required:

- Node.js 20 or later
- npm
- A modern web browser such as Chrome, Firefox, or Edge
- Supabase project credentials and environment variables
- Docker for containerized builds and deployment
- Nginx for serving the built frontend in production

## Hardware Requirements
The project does not require specialized hardware. A standard development machine is enough.

- Processor: Dual-core CPU or better
- Memory: 4 GB RAM minimum, 8 GB recommended
- Storage: At least 1 GB of free disk space for the project and dependencies
- Network: Stable internet connection for package installation and Supabase access

## DevOps Tools Used
The project uses the following DevOps-related tools and practices:

- Docker for building and packaging the application into a deployable container.
- Nginx as the production web server for serving the compiled frontend.
- Supabase Edge Functions for serverless shortening and redirect logic.
- Supabase database migrations for schema management.
- Supabase Row Level Security for access control at the database layer.
- Environment variables for configuring Supabase project credentials during build and runtime.
- Vite build pipeline for producing the production-ready frontend bundle.
- ESLint and Vitest to support code quality and verification during development.

## Summary
Link Weaver is a well-structured URL shortener that combines a modern frontend, Supabase-backed authentication and storage, and serverless link processing. It supports authenticated link management, private URLs, redirects, and click tracking, while also including a container-based deployment setup with Docker and Nginx. The result is a compact, scalable project that is ready for both development and production use.
