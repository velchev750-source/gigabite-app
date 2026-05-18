Project Requirements
Technologies
Backend: Implement a back-end API with Next.js + PostgreSQL.
Database: Neon serverless PostgreSQL + Drizzle ORM.
Web app: Implement a front-end Web app in Next.js + React + TypeScript + Tailwind.
Mobile app: Implement a client mobile app with React Native + Expo.
Architecture
Use a client-server architecture:
React frontend with Next.js backend, communicating via Server Actions.
React Native (Expo) mobile client with Next.js backend, communicating via RESTful API.
Structure your app in a Node.js monorepo: Next.js Web app + Expo mobile app.
The Next.js app will hold your back-end APIs + Web client app.
The Expo app will hold your React Native mobile app.
Serverless deployment on a managed platform (like Netlify) with serverless database (like Neon).
Web App
Implement minimum 10 app screens (pages / popups / others) in the Web client app.
Examples: register, login, main page, view details page, about page, user dashboard (view / add / edit / delete entity), admin panel.
Implement responsive design for desktop and mobile browsers.
Use icons, effects and visual cues to enhance user experience and make the UI more intuitive.
To avoid repeating code, extract repeatable UI code and logic in reusable components.
Mobile App
Implement minimum 5 app screens (pages / popups / others) in the mobile app.
Implement responsive layout for smartphones (small screens) and tablets (large screens).
Implement only the most important end-user functionality in the mobile app. Leave the admin panel and other non-essential functionality for the Web app.
Place different app screens in separate components (for easier maintenance).
Backend
Use Next.js + Drizzle ORM + PostgreSQL as a backend to keep all app data.
Store data tables in PostgreSQL (e.g. serverless Neon DB), accessed with Drizzle ORM.
Use JWT tokens for authentication (register, login, logout), hash passwords in the DB (e.g. with `bcrypt`).
Use object storage (like Cloudflare R2) to upload / download photos and files at the server-side.
Structure app logic as services, exposed through a RESTful API and consumed by Next.js Server Components.
Authentication and Authorization
Use JWT tokens for authentication and authorization, with custom code or specialized library like Auth.js.
Implement users (register, login, logout) and roles (e.g. regular and admin users).
Store user passwords in the DB using secure one-way hashing algorithms such as bcrypt or argon2.
Enforce access control using authorization checks in API endpoints, server-side components, and middleware / interceptor logic.
Implement admin panel in the Web app or similar concept (for special users, different from regular). For example, in a soccer planner app, group managers are special users who manage a group dashboard.
Database
Your database should hold minimum 4 DB tables (with relationships when needed).
Example (blog): users, articles, photos, comments.
Example (social network): users, posts, comments, messages.
Use best practices to design the DB schema, including normalization, indexing, and relationships.
Always use Drizzle migrations to make changes in the DB schema.
Your DB migration SQL scripts should be committed in the GitHub repo.
Create a database seed script to initially insert sample data in DB.
Implement your database access logic with Drizzle API. Ensure you work efficiently with the DB.
Scalability
Design the app to scale efficiently and maintain performance when handling thousands of DB entities.
Implement server-side data paging for data retrieval and display to prevent performance degradation or UI or server unresponsiveness when working with large datasets.
