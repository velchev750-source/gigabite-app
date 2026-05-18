## Gigabite is a food order app.
- Gigabite app is next.js + Expo app to order food.
    Workspace Gigabite-web is next.js based back-end + web front-end
    Workspace Gigabite-mobile is expo based mobile client app

## Technololies

- Next.js + Neon DB + Drizzle ORM + React + Tailwind

## Architectural Guidelines

**service layer** - for the business logic used by the RESTfulAPI
**modular design** - split the app into self contained components to avoid big files
**authentication**  - use JWT token + bcrypt, never save passwords in plain text
**database** - Neon DB + Drizzle ORM

## User interface

 - Implement modern UI, responsive design, use server rendered components in Next.js and App router
 - Primary use server side rentering. Use client side for user interaction and forms
 
## Database and Migrations Rules

1. Always use Drizzle ORM for database access. Do not write raw SQL in the app logic unless there is a strong technical reason.

2. All database schema changes must be made through Drizzle schema files and Drizzle migrations. Never change the production database manually.

3. After every schema change, generate and commit the migration files to the GitHub repository.

4. Keep the database normalized and use clear relationships between tables with proper foreign keys, indexes, and constraints.

5. When adding or changing database tables, also update the seed script, TypeScript types, API validation, and documentation if needed.


## Business logic
**Gigabite-web**                                                               *Basic guidelines*
 - Logged customers can order items from menu, check order status , check order history in account menu. Not logged customers can only browse site, but not order.
 - Staff can check confirmed orders, change status from pending to ready in staff menu
 - Menagers can change status of orders from pending to confirmed, can delete pending orders, can add menu items, can edit menu items, can delete items.

 **Gigabite-mobile**
   *Basic guidelines*
- Has customer functionalities only, no staff and no manager functionalities.


 ## Tech Guidelines

 **Gigabite-mobile** 
 - Technologies: React Native + Expo + Expo Router
 - Back-end: RESTful API with "bearer token"
 - Back-end: source code apps/Gigabite-mobile/src/app/api
 - Modular design: split the app into meaningful components, to avoid too much code in single file and reuse reapeating code
 - Architectutal Guidelines: modular design, RESTful Api
 - Mobile UI: user-friendly UI , stack navigation, responsive layout 
 - Mobile UI alerts: ensure all native alerts, confirms and other system dialogues have a fallback for Web (implement as modal pop up )
