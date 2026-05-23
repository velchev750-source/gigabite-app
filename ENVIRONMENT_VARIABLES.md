# Environment Variables

Този документ описва environment variables за Gigabite. Не поставяйте реални пароли, токени или private keys в документация или GitHub repository.

## Web Приложение

Файл за локална разработка:

```text
apps/Gigabite-web/.env.local
```

Примерен файл:

```text
apps/Gigabite-web/.env.example
```

### DATABASE_URL

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

Connection string към PostgreSQL базата данни. Използва се от Drizzle ORM, migrations, seed скриптовете и runtime API логиката.

За Neon обикновено стойността съдържа `sslmode=require`.

### JWT_SECRET

```env
JWT_SECRET=change-me
```

Secret ключ за подписване и проверка на JWT токени.

В development има fallback стойност, но в production тази променлива е задължителна. Използвайте дълга, случайна стойност.

### NEXT_PUBLIC_APP_URL

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Публичният URL на уеб приложението. Използва се при генериране на абсолютни URL адреси и при production конфигурация.

Локално:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Production пример:

```env
NEXT_PUBLIC_APP_URL=https://your-web-app.netlify.app
```

### R2_ACCOUNT_ID

```env
R2_ACCOUNT_ID=your-cloudflare-account-id
```

Cloudflare account id. Използва се за изграждане на R2 endpoint, ако `R2_ENDPOINT` не е зададен.

### R2_BUCKET_NAME

```env
R2_BUCKET_NAME=your-r2-bucket
```

Името на Cloudflare R2 bucket-а за качване на снимки.

### R2_ACCESS_KEY_ID

```env
R2_ACCESS_KEY_ID=your-r2-access-key-id
```

Access key за R2 S3-compatible API.

### R2_SECRET_ACCESS_KEY

```env
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
```

Secret key за R2 S3-compatible API. Това е чувствителна стойност и не трябва да се commit-ва.

### R2_PUBLIC_URL

```env
R2_PUBLIC_URL=https://cdn.example.com
```

Публичният base URL, от който качените изображения са достъпни.

### R2_ENDPOINT

```env
R2_ENDPOINT=https://your-cloudflare-account-id.r2.cloudflarestorage.com
```

Опционален R2 endpoint. Ако е зададен, приложението го използва директно. Ако липсва, endpoint-ът се изгражда от `R2_ACCOUNT_ID`.

## GitHub Actions Backup

Workflow-ът `.github/workflows/backup-db.yml` използва отделен private R2 bucket за database backup-и. Тези стойности се задават като GitHub repository secrets, не като Netlify environment variables.

```env
DATABASE_URL=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BACKUP_BUCKET_NAME=
```

`R2_BACKUP_BUCKET_NAME` е bucket-ът за backup архиви. Той е отделен от `R2_BUCKET_NAME`, който уеб приложението използва за публични продуктови и Hot Deal изображения.

## Mobile Приложение

Файл за локална разработка:

```text
apps/Gigabite-mobile/.env
```

Примерен файл:

```text
apps/Gigabite-mobile/.env.example
```

### EXPO_PUBLIC_API_URL

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Base URL към Next.js API-то. Мобилното приложение използва REST endpoint-и под `/api/mobile`.

Локално за web preview:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Локално за физическо устройство:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.25:3000
```

Production пример:

```env
EXPO_PUBLIC_API_URL=https://your-web-api.netlify.app
```

## Минимална Локална Конфигурация

За basic development без upload на снимки:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
JWT_SECRET=local-development-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Production Конфигурация

За production deployment задайте всички нужни стойности в Netlify Environment Variables:

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

За mobile web deployment:

```env
EXPO_PUBLIC_API_URL=
```

За автоматичния database backup в GitHub Actions задайте отделно repository secrets:

```env
DATABASE_URL=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BACKUP_BUCKET_NAME=
```

## Сигурност

- Не commit-вайте `.env.local` или `.env` файлове.
- Не използвайте demo пароли в production.
- Сменяйте `JWT_SECRET`, ако е бил споделен публично.
- Използвайте отделни R2 keys за development и production.
- Ограничете правата на R2 credentials само до нужния bucket.
