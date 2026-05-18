import { roles } from "./schema";
import { db } from ".";

async function main() {
  await db
    .insert(roles)
    .values([{ name: "user" }, { name: "staff" }, { name: "manager" }])
    .onConflictDoNothing({ target: roles.name });
}

main()
  .then(() => {
    console.log("Seeded roles.");
  })
  .catch((error) => {
    console.error("Failed to seed database.");
    console.error(error);
    process.exit(1);
  });
