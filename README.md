# School Management System (Backend)

A comprehensive, robust, and modular backend solution for managing school operations. Built with modern web technologies, this system provides a secure, scalable, and efficient foundation for educational institutions.

## 🚀 Key Features

*   **🔐 Authentication & Authorization**: Secure JWT-based authentication with Role-Based Access Control (RBAC) using CASL. Includes support for `sudo` mode, Two-Factor Authentication (2FA), and secure cookie sessions.
*   **👥 User Management**: Complete lifecycle management for **Students**, **Teachers**, **Staff**, **Guardians**, and **Admins**.
*   **📚 Academic Management**:
    *   **Classes & Sections**: Manage classrooms, routines, and academic years.
    *   **Subjects & Enrollments**: Handle core and optional subjects, student enrollments, and faculties.
    *   **Lesson Plans**: structured lesson planning for teachers.
    *   **Attendance**: Track daily attendance for students and staff.
    *   **Examinations**: Comprehensive exam system including scheduling, grading, and result generation.
*   **💰 Finance System**: Manage invoices, payments, and financial records.
*   **💬 Communication**:
    *   **Real-time Online Classes**: Integration with Stream.io for robust online classes systems.
    *   **Notices**: Broadcast important announcements.
    *   **Events**: Calendar and event management.
*   **📂 File Management**: Handle file uploads (local/cloud) for assignments, resources, and profiles.
*   **🏢 Administrative**:
    *   **Branches**: Multi-branch support.
    *   **Dormitories**: Manage student housing.
    *   **Transportation**: Bus routes and transport management.
    *   **Inventory/Library**: Library system management.
*   **🛡️ Robustness**:
    *   **Error Tracking**: Integrated with Sentry.
    *   **Rate Limiting**: Throttling enabled for API protection.
    *   **Caching**: Redis-based caching for performance.
    *   **Validation**: Global validation pipes and strict environment variable validation.
    *   **Logging**: structured logging.

## 🛠 Tech Stack

**Core Framework**:
*   [NestJS](https://nestjs.com/) (v11) - Progressive Node.js framework.
*   [Fastify](https://www.fastify.io/) - High-performance web framework (used as the underlying HTTP adapter).
*   [TypeScript](https://www.typescriptlang.org/) - Typed superset of JavaScript.

**Database & Storage**:
*   [MySQL](https://www.mysql.com/) - Relational database.
*   [TypeORM](https://typeorm.io/) - ORM for database interaction.
*   [Redis](https://redis.io/) - In-memory data store for caching and queues.

**Testing & Quality**:
*   [Jest](https://jestjs.io/) - Testing framework.
*   [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/) - Code linting and formatting.

**External Services & Tools**:
*   [Docker](https://www.docker.com/) - Containerization.
*   [Sentry](https://sentry.io/) - Error monitoring.
*   [Stream](https://getstream.io/) - Real-time video features.
*   [Nodemailer](https://nodemailer.com/) - Email services.

## 📦 System Architecture

The project follows a **Modular Architecture** enforced by NestJS. Each major feature is encapsulated in its own module (e.g., `AuthSystemModule`, `StudentsModule`, `FinanceSystemModule`), promoting separation of concerns and maintainability.

### Key Modules:
*   `src/auth-system`: Authentication, 2FA, CASL permissions.
*   `src/academic-years`, `src/classes`: Core academic structures.
*   `src/examination-system`: Exams and results logic.
*   `src/finance-system`: Fee structure and payments.
*   `src/conversation-system`: Chat functionality.
*   `src/datasource`: TypeORM database configuration.
*   `src/common`: Shared guards, filters, interceptors, and decorators.

## 🛠️ Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   pnpm (recommended) or npm
*   MySQL
*   Redis

### 1. Clone the Repository
```bash
git clone https://github.com/Prakash-Banjade/school-management-system-backend.git
cd school-management-system-backend
```

### 2. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory. You can copy the example:
```bash
cp .env.example .env.local
```
**Required Variables** (Update these in `.env.local`):
*   `DATABASE_URL`: `mysql://user:password@localhost:3306/db_name`
*   `REDIS_URL`: `redis://localhost:6379`
*   `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`: Secure strings for JWT.
*   `CLIENT_URL`: URL of the frontend application.
*   See `src/env/env.schema.ts` for the full list of required variables.

### 4. Run Infrastructure (Docker)
You can spin up MySQL and Redis using Docker Compose:
```bash
docker-compose up -d
```

### 5. Running the App

**Development**:
```bash
npm run dev
# or
nest start --watch
```

**Production**:
```bash
npm run build
npm run prod
```

**Debug**:
```bash
npm run debug
```

## 📚 API Documentation

The application includes Swagger UI for API documentation.

1.  Start the application.
2.  Navigate to: `http://localhost:3000/api` (or your configured port).
3.  Explore the endpoints, schemas, and test APIs directly.

> **Note**: Swagger is enabled only in non-production environments by default.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---
**Author**: [Prakash Banjade](https://github.com/Prakash-Banjade)