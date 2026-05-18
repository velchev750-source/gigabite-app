import bcrypt from "bcryptjs";
import { inArray } from "drizzle-orm";

import { db } from ".";
import { categories, products, roles, users } from "./schema";

const roleNames = ["user", "staff", "manager"] as const;

const seedUsers = [
  {
    email: "user100@gigabite.demo",
    name: "User100",
    password: "Pass100",
    role: "user",
  },
  {
    email: "user101@gigabite.demo",
    name: "User101",
    password: "Pass101",
    role: "user",
  },
  {
    email: "user102@gigabite.demo",
    name: "User102",
    password: "Pass102",
    role: "user",
  },
  {
    email: "staff200@gigabite.demo",
    name: "Staff200",
    password: "Pass200",
    role: "staff",
  },
  {
    email: "staff201@gigabite.demo",
    name: "Staff201",
    password: "Pass201",
    role: "staff",
  },
  {
    email: "staff202@gigabite.demo",
    name: "Staff202",
    password: "Pass202",
    role: "staff",
  },
  {
    email: "manager300@gigabite.demo",
    name: "Manager300",
    password: "Pass300",
    role: "manager",
  },
] satisfies Array<{
  email: string;
  name: string;
  password: string;
  role: (typeof roleNames)[number];
}>;

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
    },
  ],
} satisfies Record<
  string,
  Array<{
    name: string;
    description: string;
    price: string;
  }>
>;

async function main() {
  await seedRoles();
  const roleIds = await getRoleIds();

  await seedDemoUsers(roleIds);
  await seedMenu();
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
        roleId,
      };
    }),
  );

  await db.insert(users).values(values).onConflictDoNothing({ target: users.email });
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
        isActive: true,
        sortOrder: index + 1,
      }));
  });

  if (!missingProducts.length) {
    return;
  }

  await db.insert(products).values(missingProducts);
}

main()
  .then(() => {
    console.log("Seeded roles, demo users, categories, and products.");
  })
  .catch((error) => {
    console.error("Failed to seed database.");
    console.error(error);
    process.exit(1);
  });
