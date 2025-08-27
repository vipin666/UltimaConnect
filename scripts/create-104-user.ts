import { db } from "../server/db";
import { users } from "../shared/schema";
import { hashPassword } from "../server/auth";
import { eq } from "drizzle-orm";

async function create104User() {
  try {
    console.log("Creating user for flat 104...");
    
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, 'vipindas104'))
      .limit(1);
    
    if (existingUser.length > 0) {
      console.log("User vipindas104 already exists!");
      console.log("Username: vipindas104");
      console.log("Password: resident104");
      return;
    }
    
    // Create new user
    const hashedPassword = await hashPassword('resident104');
    await db.insert(users).values({
      username: 'vipindas104',
      password: hashedPassword,
      firstName: 'VIPINDAS',
      lastName: '',
      email: 'vipindas104@towerconnect.local',
      role: 'resident',
      status: 'active',
      isOwner: true,
      unitNumber: '104',
    });
    
    console.log("User created successfully!");
    console.log("Username: vipindas104");
    console.log("Password: resident104");
    
  } catch (error) {
    console.error("Error creating user:", error);
  }
}

create104User().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
