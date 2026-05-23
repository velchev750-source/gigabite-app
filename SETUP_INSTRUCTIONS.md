# Инструкции за Локална Инсталация

Този документ описва как да стартирате Gigabite локално за разработка, демонстрация или Capstone review.

## Изисквания

- Node.js 20 LTS или по-нова стабилна версия.
- npm 10 или по-нова версия.
- Git.
- Neon PostgreSQL база данни или локална PostgreSQL база.
- Expo CLI чрез `npx expo` или npm scripts.
- По желание: Cloudflare R2 bucket за качване на снимки.

Проверка на инсталираните версии:

```bash
node -v
npm -v
git --version
```

## Инсталация

1. Клонирайте repository-то:

```bash
git clone <repository-url>
cd gigabite-app
```

2. Инсталирайте зависимостите от root папката:

```bash
npm install
```

Проектът използва npm workspaces за:

- `apps/Gigabite-web`
- `apps/Gigabite-mobile`

## Environment Variables

Създайте локални `.env` файлове от примерите.

### Web

```bash
cd apps/Gigabite-web
copy .env.example .env.local
```

На macOS/Linux еквивалентът е:

```bash
cp .env.example .env.local
```

Попълнете стойностите в `apps/Gigabite-web/.env.local`.

Минимално нужни за локална разработка:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
JWT_SECRET=change-this-local-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

R2 променливите са нужни за upload на снимки. Ако няма да тествате качване на изображения, останалата част от приложението може да се разработва без реален R2 bucket.

### Mobile

```bash
cd apps/Gigabite-mobile
copy .env.example .env
```

На macOS/Linux:

```bash
cp .env.example .env
```

Локална стойност:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Ако тествате мобилното приложение на физически телефон, заменете `localhost` с IP адреса на компютъра в локалната мрежа, например:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.25:3000
```

## Настройка на Базата Данни

1. Създайте PostgreSQL база в Neon или локално.
2. Поставете connection string в `DATABASE_URL`.
3. Стартирайте Drizzle migrations:

```bash
cd apps/Gigabite-web
npm run db:migrate
```

4. Заредете начални данни:

```bash
npm run db:seed
```

Seed скриптът създава роли, demo потребители, категории, продукти и примерни поръчки.

## Стартиране на Проекта

### Стартиране на всичко от root

От root папката:

```bash
npm run dev
```

Този script стартира workspace приложенията в dev режим.

### Web приложение и API

```bash
cd apps/Gigabite-web
npm run dev
```

По подразбиране Next.js стартира на:

```text
http://localhost:3000
```

Полезни команди:

```bash
npm run build
npm run start
npm run lint
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

### Mobile приложение

```bash
cd apps/Gigabite-mobile
npm run dev
```

Expo ще отвори development интерфейс. Оттам може да стартирате:

- Android emulator.
- iOS simulator, ако сте на macOS.
- Expo Go на физическо устройство.
- Web preview.

Полезни команди:

```bash
npm run android
npm run ios
npm run web
npm run web:clear
npm run lint
```

## Build Команди

### Web build

```bash
cd apps/Gigabite-web
npm run build
```

### Mobile static web build

От root папката:

```bash
npm run build:web
```

Или от mobile workspace:

```bash
cd apps/Gigabite-mobile
npm run build:web
```

Expo генерира статични файлове в:

```text
apps/Gigabite-mobile/dist
```

## Demo Потребители

Seed скриптът създава примерни акаунти. Основните са:

```text
Клиент:   user100@gigabite.demo / Pass100
Служител: staff200@gigabite.demo / Pass200
Мениджър: manager300@gigabite.demo / Pass300
```

Тези акаунти са подходящи за локална демонстрация. Не ги използвайте като реални production credentials.

## Основни Екрани

Web:

- `/` - начална страница.
- `/menu` - меню и Hot Deal оферти.
- `/checkout` - финализиране на поръчка.
- `/checkout/success` - успешно създадена поръчка.
- `/account` - потребителски профил.
- `/account/orders/[orderId]` - детайли за поръчка.
- `/login` - вход.
- `/register` - регистрация.
- `/admin` - мениджърски панел.
- `/staff` - служителски панел.

Mobile:

- Home tab.
- Menu tab.
- Cart tab.
- Orders tab.
- Profile tab.
- Order details screen.
- Order success screen.

## Чести Проблеми

### DATABASE_URL липсва или е грешен

Проверете `apps/Gigabite-web/.env.local` и се уверете, че connection string е валиден.

### JWT_SECRET в production

В production `JWT_SECRET` е задължителен. Използвайте дълга, случайна стойност и не я commit-вайте.

### Mobile app не достига API-то

Ако използвате физически телефон, `localhost` сочи към телефона, а не към компютъра. Използвайте локалния IP адрес на компютъра.

### Upload на снимки не работи

Проверете R2 променливите:

- `R2_BUCKET_NAME`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_PUBLIC_URL`
- `R2_ACCOUNT_ID` или `R2_ENDPOINT`

## Проверка Преди Представяне

Преди Capstone demo:

```bash
cd apps/Gigabite-web
npm run build
npm run lint
```

```bash
cd apps/Gigabite-mobile
npm run lint
npm run build:web
```

След това проверете ръчно:

- регистрация и вход;
- разглеждане на меню;
- добавяне в количка;
- checkout с pickup;
- checkout с delivery;
- преглед на поръчка в account;
- manager approval;
- staff preparation flow;
- Hot Deal добавяне и поръчка;
- мобилно меню, количка и поръчки.

