# Deployment

Този документ описва препоръчителен deployment процес за Gigabite.

## Production Компоненти

- Web приложение и API: `apps/Gigabite-web`.
- Mobile web build: `apps/Gigabite-mobile`.
- База данни: Neon PostgreSQL.
- Файлове и снимки: Cloudflare R2.
- Hosting: Netlify.

## Подготовка Преди Deployment

1. Уверете се, че всички промени са commit-нати.
2. Проверете environment variables.
3. Стартирайте build локално:

```bash
cd apps/Gigabite-web
npm run build
```

```bash
cd apps/Gigabite-mobile
npm run build:web
```

4. Стартирайте migrations към production базата:

```bash
cd apps/Gigabite-web
npm run db:migrate
```

Използвайте production `DATABASE_URL` само когато сте сигурни, че migration файловете са правилни.

## Web Deployment в Netlify

### Build Settings

Препоръчителни настройки за `Gigabite-web`:

```text
Base directory: apps/Gigabite-web
Build command: npm run build
Publish directory: .next
```

Netlify трябва да има Next.js runtime/plugin support за server-rendered Next.js приложение и route handlers.

### Environment Variables

Добавете в Netlify:

```env
DATABASE_URL=
JWT_SECRET=
NEXT_PUBLIC_APP_URL=
R2_ACCOUNT_ID=
R2_BUCKET_NAME=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_PUBLIC_URL=
R2_ENDPOINT=
```

`NEXT_PUBLIC_APP_URL` трябва да сочи към production URL адреса на web приложението.

### Database

1. Създайте Neon project.
2. Копирайте production connection string.
3. Добавете го като `DATABASE_URL` в Netlify.
4. Стартирайте migrations.
5. По желание стартирайте seed за demo данни:

```bash
cd apps/Gigabite-web
npm run db:seed
```

За реална production среда seed-ването на demo акаунти трябва да се използва внимателно.

## Mobile Web Deployment в Netlify

Expo web build-ът е статичен и може да се deploy-не отделно.

### Build Settings

```text
Base directory: apps/Gigabite-mobile
Build command: npm run build:web
Publish directory: dist
```

### Environment Variables

```env
EXPO_PUBLIC_API_URL=https://your-web-api.netlify.app
```

Тази стойност трябва да сочи към deployed Next.js web/API приложението.

## Mobile App Deployment

Текущата документация покрива Expo web deployment. За native Android/iOS production build може да се добави EAS Build конфигурация.

Примерни бъдещи стъпки:

```bash
npx eas login
npx eas build:configure
npx eas build --platform android
npx eas build --platform ios
```

Тези команди изискват EAS конфигурация и Expo account.

## Cloudflare R2 Настройка

1. Създайте R2 bucket.
2. Създайте access keys за S3-compatible API.
3. Настройте публичен достъп или custom domain за изображения.
4. Добавете environment variables в Netlify.
5. Тествайте upload през admin панела.

Приложението приема само:

- WEBP;
- PNG;
- JPEG.

Максималният размер е 5 MB.

## Проверка След Deployment

Проверете:

- начална страница;
- меню;
- регистрация;
- вход;
- checkout с pickup;
- checkout с delivery;
- account screen;
- manager panel;
- staff panel;
- Hot Deal създаване и поръчка;
- upload на продуктова снимка;
- mobile web меню и количка.

## Rollback

При проблем:

1. Върнете последния стабилен deploy от Netlify Deploys.
2. Проверете дали проблемът е в environment variables.
3. Проверете migration историята на базата.
4. Ако има database migration проблем, възстановете backup или приложете коригираща migration чрез Drizzle.

Не променяйте production базата ръчно, освен ако няма извънредна причина и имате backup.

