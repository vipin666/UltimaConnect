import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq, like } from "drizzle-orm";

async function checkUsers() {
  try {
    console.log("Checking users in database...");
    
    // Check for users with flat 104
    const flat104Users = await db
      .select({
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        unitNumber: users.unitNumber,
        role: users.role,
        status: users.status
      })
      .from(users)
      .where(like(users.unitNumber, '%104%'));
    
    console.log("\nUsers with flat 104:");
    flat104Users.forEach(user => {
      console.log(`- Username: ${user.username}, Name: ${user.firstName} ${user.lastName}, Unit: ${user.unitNumber}, Role: ${user.role}, Status: ${user.status}`);
    });
    
    // Check for users with username containing 104
    const username104Users = await db
      .select({
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        unitNumber: users.unitNumber,
        role: users.role,
        status: users.status
      })
      .from(users)
      .where(like(users.username, '%104%'));
    
    console.log("\nUsers with username containing 104:");
    username104Users.forEach(user => {
      console.log(`- Username: ${user.username}, Name: ${user.firstName} ${user.lastName}, Unit: ${user.unitNumber}, Role: ${user.role}, Status: ${user.status}`);
    });
    
    // Check for VIPINDAS specifically
    const vipindasUsers = await db
      .select({
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        unitNumber: users.unitNumber,
        role: users.role,
        status: users.status
      })
      .from(users)
      .where(eq(users.firstName, 'VIPINDAS'));
    
    console.log("\nVIPINDAS users:");
    vipindasUsers.forEach(user => {
      console.log(`- Username: ${user.username}, Name: ${user.firstName} ${user.lastName}, Unit: ${user.unitNumber}, Role: ${user.role}, Status: ${user.status}`);
    });
    
    // Show total user count
    const allUsers = await db.select().from(users);
    console.log(`\nTotal users in database: ${allUsers.length}`);
    
  } catch (error) {
    console.error("Error checking users:", error);
  }
}

checkUsers().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
