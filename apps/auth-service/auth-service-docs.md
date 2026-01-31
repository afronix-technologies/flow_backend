# Auth Service Documentation

## Overview
The **Auth Service** is a dedicated microservice responsible for handling all authentication and authorization aspects of the Afronix Tracker application. It manages users, organizations, subscriptions, and security tokens (JWT).

## Core Functionality bling

### 1. User Authentication
- **Registration**: 
  - Allows new users to sign up.
  - Automatically creates a new **Organization** for the user (acting as the Owner).
  - Triggers an email verification flow.
- **Login**:
  - Authenticates users using email and password.
  - Supports **Multi-Organization** access. If a user belongs to multiple organizations, they can choose which one to log in to, or default to their last active one.
  - Returns access and refresh tokens (JWT).
- **Logout**:
  - Invalidates the current session (client-side token removal).
- **Password Management**:
  - **Forgot Password**: Sends a reset link to the user's email.
  - **Reset Password**: Allows users to set a new password using a valid token.
  - **Change Password**: Authenticated users can update their password.

### 2. Organization Management
- **Multi-Tenancy**: The service is built around organizations. Every user belongs to at least one organization.
- **Context Switching**: Users who belong to multiple organizations can "switch" their active context. This updates their JWT to reflect the roles and permissions of the selected organization.
- **Team Management**:
  - **Invitations**: Organization Owners or Admins can invite other users to join their organization via email.
  - **Roles**: Supports different roles (e.g., OWNER, ADMIN, MEMBER) per organization.

### 3. User Management
- **Profile**: Users can view and update their personal profile (First Name, Last Name).
- **Email Verification**: Enforces email verification before allowing full system access.

## Data Models

### User
Represents a global user account.
- **Fields**: `email`, `password`, `firstName`, `lastName`, `isActive`, `emailVerified`.
- **Relations**: Can belong to multiple `Organizations` through `UserOrganization`.

### Organization
Represents a tenant or company.
- **Fields**: `name`, `subscriptionStatus`, `subscriptionExpiresAt`, `teamSize`.
- **Relations**: Has many `Users`.

### UserOrganization
Join table linking Users to Organizations with specific permissions.
- **Fields**: `role` (OWNER, ADMIN, MEMBER).

### Invitation
Tracks pending invitations sent to emails.
- **Fields**: `email`, `token`, `role`, `status` (PENDING, ACCEPTED), `expiresAt`.

## API Endpoints

### Auth (`/auth`)
- `POST /auth/register`: Create new account & organization.
- `POST /auth/login`: Authenticate and receive tokens.
- `POST /auth/logout`: End session.
- `POST /auth/verify-email`: Verify email address.
- `POST /auth/forgot-password`: Request password reset.
- `POST /auth/reset-password`: Complete password reset.

### Users (`/users`)
- `GET /users/me`: Get current user profile.
- `PUT /users/me`: Update profile details.
- `PUT /users/me/password`: Change password.
- `GET /users/organizations`: List all organizations the user belongs to.
- `POST /users/switch-organization`: specific organization context.

### Invitations (`/invitations`)
- `POST /invitations`: Invite a user (Admin/Owner only).
- `POST /invitations/accept`: Accept an invitation to join an organization.

## Use Cases

### Onboarding a New Company
1. **User** visits the registration page.
2. enters email, password, and **Company Name**.
3. **Auth Service** creates a User and an Organization (Trial Subscription).
4. User validates email and logs in as the **Owner**.

### Adding Team Members
1. **Owner** logs in.
2. Owner sends an invitation to `employee@company.com` with role `MEMBER`.
3. **Auth Service** creates an Invitation record and sends an email.
4. `employee@company.com` clicks the link, sets a password, and joins the existing Organization.

### Managing Multiple Branches
1. A **Manager** works for two companies: "TechCorp" and "DevStudio".
2. They log in and select "TechCorp". The JWT contains the `organizationId` for TechCorp.
3. They perform tasks for TechCorp.
4. They call `/users/switch-organization` to switch to "DevStudio".
5. The system issues a new JWT with `organizationId` for DevStudio.
