import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../server/auth";

async function createAdminUser() {
  try {
    console.log("Creating admin user...");
    
    // Check if admin user already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.username, 'admin'))
      .limit(1);
    
    if (existingAdmin.length > 0) {
      console.log("Admin user already exists, updating password...");
      
      // Update password for existing admin
      const hashedPassword = await hashPassword('Skymax2018');
      await db
        .update(users)
        .set({ 
          password: hashedPassword,
          role: 'super_admin',
          status: 'active',
          updatedAt: new Date()
        })
        .where(eq(users.username, 'admin'));
      
      console.log("Admin user password updated successfully!");
    } else {
      console.log("Creating new admin user...");
      
      // Create new admin user
      const hashedPassword = await hashPassword('Skymax2018');
      await db.insert(users).values({
        username: 'admin',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@ultimaskymax.com',
        role: 'super_admin',
        status: 'active',
        isOwner: true,
        unitNumber: null,
      });
      
      console.log("Admin user created successfully!");
    }
    
    console.log("\nAdmin Login Credentials:");
    console.log("Username: admin");
    console.log("Password: Skymax2018");
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser();