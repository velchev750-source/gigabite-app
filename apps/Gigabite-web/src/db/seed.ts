import bcrypt from "bcryptjs";
import { eq, inArray } from "drizzle-orm";

import { db } from ".";
import { categories, orderItems, orders, products, roles, users } from "./schema";

const roleNames = ["user", "staff", "manager"] as const;

type SeedUser = {
  email: string;
  name: string;
  phone: string;
  defaultDeliveryAddress?: string;
  workLocation?: string;
  password: string;
  role: (typeof roleNames)[number];
};

type SeedOrder = {
  note: string;
  userEmail: string;
  status:
    | "pending_approval"
    | "approved"
    | "in_progress"
    | "completed"
    | "cancel_requested"
    | "cancelled";
  deliveryType: "pickup" | "delivery";
  deliveryAddress?: string;
  managerNote?: string;
  items: Array<{
    productName: string;
    quantity: number;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
};

const sofiaAddresses = [
  "12 Vitosha Blvd, Sofia",
  "44 Patriarh Evtimiy Blvd, Sofia",
  "18 Graf Ignatiev Street, Sofia",
  "7 Shishman Street, Sofia",
  "62 Bulgaria Blvd, Sofia",
  "25 Cherni Vrah Blvd, Sofia",
  "9 Tsarigradsko Shose Blvd, Sofia",
  "31 Hristo Botev Blvd, Sofia",
  "5 Oborishte Street, Sofia",
  "73 Aleksandar Malinov Blvd, Sofia",
  "16 Solunska Street, Sofia",
  "28 Rakovski Street, Sofia",
];

const customerNotes = [
  "Please add extra napkins.",
  "No onions, please.",
  "Call when arriving.",
  "Make it less spicy.",
  "Leave at reception.",
  "Extra sauce on the side.",
  "Pickup under the front name.",
  "Please pack drinks separately.",
  "Ring the doorbell once.",
  "No cutlery needed.",
];

const managerNotes = [
  "Approved for normal prep queue.",
  "Customer called to confirm details.",
  "Address checked by manager.",
  "Cancellation accepted for dev testing.",
  "High-priority lunch order.",
  "Demo workflow order.",
];

const seedUsers: SeedUser[] = [
  {
    email: "user100@gigabite.demo",
    name: "User100",
    phone: "+359 88 100 0100",
    defaultDeliveryAddress: "24 Flavor Street, Sofia",
    password: "Pass100",
    role: "user",
  },
  {
    email: "user101@gigabite.demo",
    name: "User101",
    phone: "+359 88 100 0101",
    defaultDeliveryAddress: "8 Burger Lane, Sofia",
    password: "Pass101",
    role: "user",
  },
  {
    email: "user102@gigabite.demo",
    name: "User102",
    phone: "+359 88 100 0102",
    defaultDeliveryAddress: "15 Pizza Square, Sofia",
    password: "Pass102",
    role: "user",
  },
  {
    email: "staff200@gigabite.demo",
    name: "Staff200",
    phone: "+359 88 200 0200",
    workLocation: "Gigabite Center",
    password: "Pass200",
    role: "staff",
  },
  {
    email: "staff201@gigabite.demo",
    name: "Staff201",
    phone: "+359 88 200 0201",
    workLocation: "Gigabite Mall",
    password: "Pass201",
    role: "staff",
  },
  {
    email: "staff202@gigabite.demo",
    name: "Staff202",
    phone: "+359 88 200 0202",
    workLocation: "Gigabite Studentski Grad",
    password: "Pass202",
    role: "staff",
  },
  {
    email: "manager300@gigabite.demo",
    name: "Manager300",
    phone: "+359 88 300 0300",
    password: "Pass300",
    role: "manager",
  },
  ...generateStressStaffUsers(),
  ...generateStressCustomerUsers(),
];

const seedOrders = [
  {
    note: "Seed order 01 - pending delivery",
    userEmail: "user100@gigabite.demo",
    status: "pending_approval",
    deliveryType: "delivery",
    deliveryAddress: "24 Flavor Street, Sofia",
    items: [
      { productName: "Classic Burger", quantity: 2 },
      { productName: "Coca-Cola", quantity: 2 },
    ],
  },
  {
    note: "Seed order 02 - pending pickup",
    userEmail: "user101@gigabite.demo",
    status: "pending_approval",
    deliveryType: "pickup",
    items: [
      { productName: "Pepperoni Pizza", quantity: 1 },
      { productName: "Iced Tea", quantity: 1 },
    ],
  },
  {
    note: "Seed order 03 - approved delivery",
    userEmail: "user102@gigabite.demo",
    status: "approved",
    deliveryType: "delivery",
    deliveryAddress: "15 Pizza Square, Sofia",
    managerNote: "Approved for the lunch queue.",
    items: [
      { productName: "Double Burger", quantity: 1 },
      { productName: "Classic Fries", quantity: 1 },
    ],
  },
  {
    note: "Seed order 04 - approved pickup",
    userEmail: "user100@gigabite.demo",
    status: "approved",
    deliveryType: "pickup",
    items: [
      { productName: "Margherita Pizza", quantity: 2 },
      { productName: "Sprite", quantity: 2 },
    ],
  },
  {
    note: "Seed order 05 - in progress delivery",
    userEmail: "user101@gigabite.demo",
    status: "in_progress",
    deliveryType: "delivery",
    deliveryAddress: "8 Burger Lane, Sofia",
    managerNote: "Started by kitchen staff.",
    items: [
      { productName: "Chicken Burger", quantity: 1 },
      { productName: "Sweet Potato Fries", quantity: 1 },
    ],
  },
  {
    note: "Seed order 06 - in progress pickup",
    userEmail: "user102@gigabite.demo",
    status: "in_progress",
    deliveryType: "pickup",
    items: [
      { productName: "BBQ Chicken Pizza", quantity: 1 },
      { productName: "Mineral Water", quantity: 1 },
    ],
  },
  {
    note: "Seed order 07 - completed today",
    userEmail: "user100@gigabite.demo",
    status: "completed",
    deliveryType: "delivery",
    deliveryAddress: "24 Flavor Street, Sofia",
    items: [
      { productName: "Bacon Burger", quantity: 1 },
      { productName: "Onion Rings", quantity: 1 },
      { productName: "Fanta Orange", quantity: 1 },
    ],
  },
  {
    note: "Seed order 08 - completed pickup",
    userEmail: "user101@gigabite.demo",
    status: "completed",
    deliveryType: "pickup",
    managerNote: "Completed demo order.",
    items: [
      { productName: "Vegetarian Pizza", quantity: 1 },
      { productName: "Cheesy Fries", quantity: 1 },
    ],
  },
  {
    note: "Seed order 09 - cancel requested",
    userEmail: "user102@gigabite.demo",
    status: "cancel_requested",
    deliveryType: "delivery",
    deliveryAddress: "15 Pizza Square, Sofia",
    items: [
      { productName: "Cheeseburger", quantity: 2 },
      { productName: "Coca-Cola", quantity: 1 },
    ],
  },
  {
    note: "Seed order 10 - cancelled",
    userEmail: "user101@gigabite.demo",
    status: "cancelled",
    deliveryType: "delivery",
    deliveryAddress: "8 Burger Lane, Sofia",
    managerNote: "Cancelled test order.",
    items: [
      { productName: "Capricciosa Pizza", quantity: 1 },
      { productName: "Chicken Nuggets", quantity: 1 },
    ],
  },
] satisfies SeedOrder[];

const seedCategories = [
  {
    name: "Burgers",
    description: "Juicy grilled burgers with fresh toppings.",
    sortOrder: 1,
  },
  {
    name: "Pizzas",
    description: "Freshly baked pizzas with classic and house toppings.",
    sortOrder: 2,
  },
  {
    name: "Fries & Sides",
    description: "Crispy sides and shareable favorites.",
    sortOrder: 3,
  },
  {
    name: "Drinks",
    description: "Cold soft drinks, water, and iced tea.",
    sortOrder: 4,
  },
];

const seedProducts = {
  Burgers: [
    {
      name: "Classic Burger",
      description: "Beef patty with lettuce, tomato, onion, pickles, and house sauce.",
      price: "8.99",
      isPromo: true,
    },
    {
      name: "Cheeseburger",
      description: "Classic beef burger with melted cheddar cheese.",
      price: "9.49",
    },
    {
      name: "Bacon Burger",
      description: "Beef burger topped with crispy bacon and smoky sauce.",
      price: "10.49",
    },
    {
      name: "Chicken Burger",
      description: "Grilled chicken fillet with lettuce, tomato, and garlic mayo.",
      price: "8.49",
    },
    {
      name: "Double Burger",
      description: "Two beef patties with cheddar, pickles, and house sauce.",
      price: "12.49",
      isPromo: true,
    },
  ],
  Pizzas: [
    {
      name: "Margherita Pizza",
      description: "Tomato sauce, mozzarella, fresh basil, and olive oil.",
      price: "9.99",
    },
    {
      name: "Pepperoni Pizza",
      description: "Tomato sauce, mozzarella, and spicy pepperoni slices.",
      price: "11.49",
      isPromo: true,
    },
    {
      name: "Capricciosa Pizza",
      description: "Ham, mushrooms, mozzarella, olives, and tomato sauce.",
      price: "11.99",
    },
    {
      name: "BBQ Chicken Pizza",
      description: "Chicken, barbecue sauce, mozzarella, red onion, and peppers.",
      price: "12.49",
      isPromo: true,
    },
    {
      name: "Vegetarian Pizza",
      description: "Mozzarella, tomato sauce, mushrooms, peppers, olives, and onion.",
      price: "10.99",
    },
  ],
  "Fries & Sides": [
    {
      name: "Classic Fries",
      description: "Golden crispy fries with a light sea salt finish.",
      price: "3.49",
    },
    {
      name: "Cheesy Fries",
      description: "Crispy fries topped with warm cheddar cheese sauce.",
      price: "4.49",
      isPromo: true,
    },
    {
      name: "Sweet Potato Fries",
      description: "Crispy sweet potato fries served with dipping sauce.",
      price: "4.99",
    },
    {
      name: "Onion Rings",
      description: "Crunchy battered onion rings served hot.",
      price: "4.49",
    },
    {
      name: "Chicken Nuggets",
      description: "Tender chicken nuggets served with a dipping sauce.",
      price: "5.49",
    },
  ],
  Drinks: [
    {
      name: "Coca-Cola",
      description: "Chilled Coca-Cola soft drink.",
      price: "2.49",
    },
    {
      name: "Fanta Orange",
      description: "Chilled orange-flavored soft drink.",
      price: "2.49",
    },
    {
      name: "Sprite",
      description: "Chilled lemon-lime soft drink.",
      price: "2.49",
    },
    {
      name: "Mineral Water",
      description: "Still mineral water.",
      price: "1.99",
    },
    {
      name: "Iced Tea",
      description: "Refreshing chilled iced tea.",
      price: "2.99",
      isPromo: true,
    },
  ],
} satisfies Record<
  string,
  Array<{
    name: string;
    description: string;
    price: string;
    isPromo?: boolean;
  }>
>;

function generateStressStaffUsers(): SeedUser[] {
  return Array.from({ length: 20 }, (_, index) => {
    const staffNumber = 220 + index;

    return {
      email: `staff${staffNumber}@gigabite.demo`,
      name: `Staff${staffNumber}`,
      phone: formatBulgarianPhone(89, staffNumber),
      workLocation: [
        "Gigabite Center",
        "Gigabite Mall Paradise",
        "Gigabite Studentski Grad",
        "Gigabite Mladost",
      ][index % 4],
      password: `Pass${staffNumber}`,
      role: "staff",
    };
  });
}

function generateStressCustomerUsers(): SeedUser[] {
  return Array.from({ length: 50 }, (_, index) => {
    const userNumber = 220 + index;
    const address = sofiaAddresses[index % sofiaAddresses.length];

    return {
      email: `user${userNumber}@gigabite.demo`,
      name: `User${userNumber}`,
      phone: formatBulgarianPhone(88, userNumber),
      defaultDeliveryAddress: `${address}, entrance ${String.fromCharCode(65 + (index % 4))}`,
      password: `Pass${userNumber}`,
      role: "user",
    };
  });
}

function generateStressOrders(productNames: string[]): SeedOrder[] {
  const statuses: SeedOrder["status"][] = [
    ...Array<SeedOrder["status"]>(15).fill("pending_approval"),
    ...Array<SeedOrder["status"]>(20).fill("approved"),
    ...Array<SeedOrder["status"]>(20).fill("in_progress"),
    ...Array<SeedOrder["status"]>(25).fill("completed"),
    ...Array<SeedOrder["status"]>(10).fill("cancelled"),
    ...Array<SeedOrder["status"]>(10).fill("cancel_requested"),
  ];
  const now = new Date();
  const startOfToday = startOfDay(now);
  const yesterday = addDays(startOfToday, -1);

  return statuses.map((status, index) => {
    const orderNumber = index + 1;
    const deliveryType = index % 3 === 0 ? "pickup" : "delivery";
    const createdAt = getStressOrderCreatedAt(status, index, startOfToday, yesterday);
    const updatedAt = getStressOrderUpdatedAt(status, index, createdAt, startOfToday);
    const productOffset = index % productNames.length;
    const items = [
      {
        productName: productNames[productOffset],
        quantity: (index % 3) + 1,
      },
      {
        productName: productNames[(productOffset + 6) % productNames.length],
        quantity: (index % 2) + 1,
      },
    ];

    if (index % 4 === 0) {
      items.push({
        productName: productNames[(productOffset + 14) % productNames.length],
        quantity: 1,
      });
    }

    return {
      note: `GB-STRESS-ORDER-${orderNumber.toString().padStart(3, "0")} - ${
        customerNotes[index % customerNotes.length]
      }`,
      userEmail: `user${220 + (index % 50)}@gigabite.demo`,
      status,
      deliveryType,
      deliveryAddress:
        deliveryType === "delivery"
          ? `${sofiaAddresses[index % sofiaAddresses.length]}, floor ${(index % 8) + 1}`
          : undefined,
      managerNote: ["approved", "in_progress", "completed", "cancelled"].includes(status)
        ? managerNotes[index % managerNotes.length]
        : undefined,
      items,
      createdAt,
      updatedAt,
    };
  });
}

async function main() {
  await seedRoles();
  const roleIds = await getRoleIds();

  await seedDemoUsers(roleIds);
  await seedMenu();
  await seedDemoOrders();
  await seedStressOrders();
}

async function seedRoles() {
  await db
    .insert(roles)
    .values(roleNames.map((name) => ({ name })))
    .onConflictDoNothing({ target: roles.name });
}

async function getRoleIds() {
  const rows = await db
    .select({ id: roles.id, name: roles.name })
    .from(roles)
    .where(inArray(roles.name, [...roleNames]));

  const roleIds = new Map(rows.map((role) => [role.name, role.id]));

  for (const roleName of roleNames) {
    if (!roleIds.has(roleName)) {
      throw new Error(`Missing role after seed: ${roleName}`);
    }
  }

  return roleIds;
}

async function seedDemoUsers(roleIds: Map<(typeof roleNames)[number], number>) {
  const values = await Promise.all(
    seedUsers.map(async (user) => {
      const roleId = roleIds.get(user.role);

      if (!roleId) {
        throw new Error(`Missing role for demo user ${user.email}: ${user.role}`);
      }

      return {
        email: user.email,
        passwordHash: await bcrypt.hash(user.password, 12),
        name: user.name,
        phone: user.phone,
        defaultDeliveryAddress: user.defaultDeliveryAddress ?? null,
        workLocation: user.workLocation ?? null,
        roleId,
      };
    }),
  );

  await db.insert(users).values(values).onConflictDoNothing({ target: users.email });
  await fillBlankDemoUserProfiles();
}

async function fillBlankDemoUserProfiles() {
  for (const seedUser of seedUsers) {
    const [existingUser] = await db
      .select({
        id: users.id,
        phone: users.phone,
        defaultDeliveryAddress: users.defaultDeliveryAddress,
        workLocation: users.workLocation,
      })
      .from(users)
      .where(eq(users.email, seedUser.email))
      .limit(1);

    if (!existingUser) {
      continue;
    }

    await db
      .update(users)
      .set({
        phone: existingUser.phone || seedUser.phone,
        defaultDeliveryAddress:
          existingUser.defaultDeliveryAddress || seedUser.defaultDeliveryAddress || null,
        workLocation: existingUser.workLocation || seedUser.workLocation || null,
      })
      .where(eq(users.id, existingUser.id));
  }
}

async function seedMenu() {
  await insertMissingCategories();

  const categoryRows = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(inArray(categories.name, seedCategories.map((category) => category.name)));

  const categoryIds = new Map(categoryRows.map((category) => [category.name, category.id]));
  await insertMissingProducts(categoryIds);
}

async function insertMissingCategories() {
  const existingCategories = await db
    .select({ name: categories.name })
    .from(categories)
    .where(inArray(categories.name, seedCategories.map((category) => category.name)));

  const existingCategoryNames = new Set(existingCategories.map((category) => category.name));
  const missingCategories = seedCategories.filter(
    (category) => !existingCategoryNames.has(category.name),
  );

  if (!missingCategories.length) {
    return;
  }

  await db.insert(categories).values(
    missingCategories.map((category) => ({
      name: category.name,
      description: category.description,
      sortOrder: category.sortOrder,
      isActive: true,
    })),
  );
}

async function insertMissingProducts(categoryIds: Map<string, number>) {
  const seedProductNames = Object.values(seedProducts)
    .flat()
    .map((product) => product.name);

  const existingProducts = await db
    .select({ name: products.name })
    .from(products)
    .where(inArray(products.name, seedProductNames));

  const existingProductNames = new Set(existingProducts.map((product) => product.name));
  const missingProducts = Object.entries(seedProducts).flatMap(([categoryName, categoryProducts]) => {
    const categoryId = categoryIds.get(categoryName);

    if (!categoryId) {
      throw new Error(`Missing category after seed: ${categoryName}`);
    }

    return categoryProducts
      .filter((product) => !existingProductNames.has(product.name))
      .map((product, index) => ({
        categoryId,
        name: product.name,
        description: product.description,
        price: product.price,
        isPromo: product.isPromo ?? false,
        isActive: true,
        sortOrder: index + 1,
      }));
  });

  if (!missingProducts.length) {
    await syncSeedProductPromoFlags();
    return;
  }

  await db.insert(products).values(missingProducts);
  await syncSeedProductPromoFlags();
}

async function syncSeedProductPromoFlags() {
  for (const categoryProducts of Object.values(seedProducts)) {
    for (const product of categoryProducts) {
      await db
        .update(products)
        .set({ isPromo: product.isPromo ?? false })
        .where(eq(products.name, product.name));
    }
  }
}

async function seedDemoOrders() {
  await insertSeedOrders(seedOrders);
}

async function seedStressOrders() {
  const productRows = await db
    .select({ name: products.name })
    .from(products)
    .where(inArray(products.name, Object.values(seedProducts).flatMap((items) => items.map((item) => item.name))));
  const productNames = productRows.map((product) => product.name);

  if (!productNames.length) {
    throw new Error("Cannot create stress orders without seeded products.");
  }

  await insertSeedOrders(generateStressOrders(productNames));
}

async function insertSeedOrders(ordersToSeed: SeedOrder[]) {
  const existingSeedOrders = await db
    .select({ customerNote: orders.customerNote })
    .from(orders)
    .where(inArray(orders.customerNote, ordersToSeed.map((order) => order.note)));
  const existingNotes = new Set(existingSeedOrders.map((order) => order.customerNote));
  const missingOrders = ordersToSeed.filter((order) => !existingNotes.has(order.note));

  if (!missingOrders.length) {
    return;
  }

  const userRows = await db
    .select({
      id: users.id,
      email: users.email,
    })
    .from(users)
    .where(inArray(users.email, missingOrders.map((order) => order.userEmail)));
  const userIdsByEmail = new Map(userRows.map((user) => [user.email, user.id]));

  const productNames = [...new Set(missingOrders.flatMap((order) => order.items.map((item) => item.productName)))];
  const productRows = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
    })
    .from(products)
    .where(inArray(products.name, productNames));
  const productsByName = new Map(productRows.map((product) => [product.name, product]));

  const [manager] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "manager300@gigabite.demo"))
    .limit(1);

  for (const [index, seedOrder] of missingOrders.entries()) {
    const userId = userIdsByEmail.get(seedOrder.userEmail);

    if (!userId) {
      throw new Error(`Missing customer for seed order: ${seedOrder.userEmail}`);
    }

    const createdAt = seedOrder.createdAt ?? new Date();
    createdAt.setHours(createdAt.getHours() - (seedOrder.createdAt ? 0 : missingOrders.length - index));
    const updatedAt = seedOrder.updatedAt ?? (seedOrder.status === "completed" ? new Date() : createdAt);

    const itemValues = seedOrder.items.map((item) => {
      const product = productsByName.get(item.productName);

      if (!product) {
        throw new Error(`Missing product for seed order: ${item.productName}`);
      }

      const lineTotalCents = toCents(product.price) * BigInt(item.quantity);

      return {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
        lineTotal: formatCents(lineTotalCents),
      };
    });
    const totalPrice = formatCents(
      itemValues.reduce((sum, item) => sum + toCents(item.lineTotal), BigInt(0)),
    );

    const [createdOrder] = await db
      .insert(orders)
      .values({
        userId,
        status: seedOrder.status,
        deliveryType: seedOrder.deliveryType,
        deliveryAddress:
          seedOrder.deliveryType === "delivery" ? seedOrder.deliveryAddress : null,
        customerNote: seedOrder.note,
        managerNote: seedOrder.managerNote ?? null,
        totalPrice,
        approvedByManagerId:
          manager && ["approved", "in_progress", "completed"].includes(seedOrder.status)
            ? manager.id
            : null,
        cancelRequestedAt:
          seedOrder.status === "cancel_requested" || seedOrder.status === "cancelled"
            ? createdAt
            : null,
        cancelApprovedAt: seedOrder.status === "cancelled" ? updatedAt : null,
        createdAt,
        updatedAt,
      })
      .returning({ id: orders.id });

    await db.insert(orderItems).values(
      itemValues.map((item) => ({
        ...item,
        orderId: createdOrder.id,
      })),
    );
  }
}

function toCents(value: string) {
  const [whole = "0", fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0").slice(0, 2));
}

function formatCents(value: bigint) {
  const zero = BigInt(0);
  const centsPerUnit = BigInt(100);
  const sign = value < zero ? "-" : "";
  const absoluteValue = value < zero ? -value : value;
  const whole = absoluteValue / centsPerUnit;
  const fraction = (absoluteValue % centsPerUnit).toString().padStart(2, "0");

  return `${sign}${whole}.${fraction}`;
}

function formatBulgarianPhone(prefix: 88 | 89, seed: number) {
  const suffix = String(seed).padStart(4, "0");

  return `+359 ${prefix} ${suffix.slice(0, 3)} ${suffix.slice(3)}${seed % 10}`;
}

function getStressOrderCreatedAt(
  status: SeedOrder["status"],
  index: number,
  startOfToday: Date,
  yesterday: Date,
) {
  if (status === "completed" && index % 3 === 0) {
    const date = new Date(startOfToday);
    date.setHours(10 + (index % 8), (index * 7) % 60, 0, 0);
    return date;
  }

  if (["approved", "in_progress", "pending_approval", "cancel_requested"].includes(status)) {
    const date = new Date(startOfToday);
    date.setHours(8 + (index % 10), (index * 11) % 60, 0, 0);
    return date;
  }

  const daysBack = status === "completed" ? 2 + (index % 12) : 1 + (index % 14);
  const date = addDays(yesterday, -daysBack);
  date.setHours(11 + (index % 9), (index * 13) % 60, 0, 0);
  return date;
}

function getStressOrderUpdatedAt(
  status: SeedOrder["status"],
  index: number,
  createdAt: Date,
  startOfToday: Date,
) {
  if (status === "completed" && index % 3 === 0) {
    const date = new Date(startOfToday);
    date.setHours(12 + (index % 8), (index * 9) % 60, 0, 0);
    return date;
  }

  if (status === "completed" || status === "cancelled") {
    const date = new Date(createdAt);
    date.setHours(date.getHours() + 1);
    return date;
  }

  return createdAt;
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

main()
  .then(() => {
    console.log("Seeded roles, demo users, profile data, categories, products, and demo orders.");
  })
  .catch((error) => {
    console.error("Failed to seed database.");
    console.error(error);
    process.exit(1);
  });
