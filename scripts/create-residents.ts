import { hashPassword } from "../server/auth";
import { db } from "../server/db";
import { users } from "@shared/schema";

// Parse the building resident data from the provided PDF
const buildingResidents = [
  // Floor 1
  { flatNo: "101A", name: "", isOwner: true, isTenant: false },
  { flatNo: "101B", name: "ANN JOSEPH", isOwner: true, isTenant: false },
  { flatNo: "101B", name: "JOSEPH VAGHESE", isOwner: false, isTenant: false },
  { flatNo: "101C", name: "NOORIN SHEREEF", isOwner: false, isTenant: true },
  { flatNo: "101C", name: "FAHIM", isOwner: false, isTenant: true },
  { flatNo: "101D", name: "PAUL", isOwner: false, isTenant: true },
  { flatNo: "101D", name: "AKIN", isOwner: false, isTenant: true },
  { flatNo: "101D", name: "REXY", isOwner: false, isTenant: true },
  { flatNo: "101D", name: "ANIKA", isOwner: false, isTenant: true },

  // Floor 2
  { flatNo: "102A", name: "", isOwner: true, isTenant: false },
  { flatNo: "102B", name: "VINAYAK SASIKUMAR", isOwner: true, isTenant: false },
  { flatNo: "102B", name: "ANJALI", isOwner: false, isTenant: false },
  { flatNo: "102C", name: "", isOwner: true, isTenant: false },
  { flatNo: "102D", name: "JOSHY ABRAHAM", isOwner: true, isTenant: false },
  { flatNo: "102D", name: "BETSY", isOwner: false, isTenant: false },
  { flatNo: "102D", name: "ELIAMMA", isOwner: false, isTenant: false },
  { flatNo: "102D", name: "JUDITH", isOwner: false, isTenant: false },
  { flatNo: "102D", name: "JEREMY", isOwner: false, isTenant: false },

  // Floor 3
  { flatNo: "103A", name: "", isOwner: true, isTenant: false },
  { flatNo: "103B", name: "JILS", isOwner: false, isTenant: true },
  { flatNo: "103B", name: "ANIRUDH", isOwner: false, isTenant: true },
  { flatNo: "103B", name: "NIDHI", isOwner: false, isTenant: true },
  { flatNo: "103B", name: "LALITHA", isOwner: false, isTenant: true },
  { flatNo: "103B", name: "ANU", isOwner: false, isTenant: true },
  { flatNo: "103E", name: "SHAFI", isOwner: false, isTenant: true },
  { flatNo: "103E", name: "SHAHIRA", isOwner: false, isTenant: true },
  { flatNo: "103E", name: "ISHAL", isOwner: false, isTenant: true },
  { flatNo: "103F", name: "AKHIL", isOwner: true, isTenant: false },
  { flatNo: "103F", name: "ANILA", isOwner: false, isTenant: false },
  { flatNo: "103G", name: "KIRAN", isOwner: false, isTenant: true },
  { flatNo: "103G", name: "NEETHU", isOwner: false, isTenant: true },

  // Floor 4
  { flatNo: "104A", name: "VIPINDAS", isOwner: true, isTenant: false },
  { flatNo: "104A", name: "BHAVANA", isOwner: false, isTenant: false },
  { flatNo: "104B", name: "", isOwner: true, isTenant: false },
  { flatNo: "104E", name: "", isOwner: true, isTenant: false },
  { flatNo: "104F", name: "", isOwner: true, isTenant: false },
  { flatNo: "104G", name: "RAJEEV", isOwner: true, isTenant: false },
  { flatNo: "104G", name: "SANDHYA", isOwner: false, isTenant: false },
  { flatNo: "104G", name: "RITHWIK", isOwner: false, isTenant: false },

  // Floor 5
  { flatNo: "105A", name: "SOJAN GEORGE", isOwner: true, isTenant: false },
  { flatNo: "105A", name: "ANNAMMA GEORGE", isOwner: false, isTenant: false },
  { flatNo: "105A", name: "SOSU", isOwner: false, isTenant: false },
  { flatNo: "105A", name: "FIONA", isOwner: false, isTenant: false },
  { flatNo: "105B", name: "NAVEEN", isOwner: true, isTenant: false },
  { flatNo: "105B", name: "JAMES", isOwner: false, isTenant: false },
  { flatNo: "105E", name: "", isOwner: true, isTenant: false },
  { flatNo: "105F", name: "", isOwner: true, isTenant: false },
  { flatNo: "105G", name: "SINITH", isOwner: true, isTenant: false },
  { flatNo: "105G", name: "SHABNAM", isOwner: false, isTenant: false },
  { flatNo: "105G", name: "ARNIKA", isOwner: false, isTenant: false },

  // Floor 6
  { flatNo: "106A", name: "", isOwner: true, isTenant: false },
  { flatNo: "106B", name: "NITHYA", isOwner: true, isTenant: false },
  { flatNo: "106B", name: "RAHUL", isOwner: false, isTenant: false },
  { flatNo: "106B", name: "PRANAV", isOwner: false, isTenant: false },
  { flatNo: "106E", name: "JAYAKUMAR", isOwner: true, isTenant: false },
  { flatNo: "106E", name: "GREESHMA", isOwner: false, isTenant: false },
  { flatNo: "106F", name: "SREEJITH", isOwner: true, isTenant: false },
  { flatNo: "106F", name: "SMITHA", isOwner: false, isTenant: false },
  { flatNo: "106F", name: "ADITHYA", isOwner: false, isTenant: false },
  { flatNo: "106G", name: "MANICHAND", isOwner: false, isTenant: true },
  { flatNo: "106G", name: "NIKHILA", isOwner: false, isTenant: true },

  // Floor 7
  { flatNo: "107G", name: "", isOwner: true, isTenant: false },
  { flatNo: "107H", name: "LABEEBA", isOwner: false, isTenant: true },
  { flatNo: "107H", name: "RASHEED", isOwner: false, isTenant: true },
  { flatNo: "107H", name: "INARA", isOwner: false, isTenant: true },
  { flatNo: "107I", name: "KAVYA", isOwner: false, isTenant: true },
  { flatNo: "107I", name: "VINAY", isOwner: false, isTenant: true },
  { flatNo: "107J", name: "AKSHAY", isOwner: false, isTenant: true },
  { flatNo: "107K", name: "BIBIN", isOwner: false, isTenant: true },
  { flatNo: "107K", name: "DIMPLE", isOwner: false, isTenant: true },
  { flatNo: "107L", name: "YADHU", isOwner: true, isTenant: false },
  { flatNo: "107L", name: "JESSY", isOwner: false, isTenant: false },
  { flatNo: "107M", name: "TOBIN", isOwner: true, isTenant: false },
  { flatNo: "107M", name: "VIJAYAN", isOwner: false, isTenant: false },
  { flatNo: "107M", name: "RAJISHA", isOwner: false, isTenant: false },
  { flatNo: "107M", name: "SHEELA", isOwner: false, isTenant: false },
  { flatNo: "107M", name: "ANJU", isOwner: false, isTenant: false },

  // Floor 8
  { flatNo: "108G", name: "ASHOK KUMAR", isOwner: false, isTenant: true },
  { flatNo: "108H", name: "ANJU", isOwner: true, isTenant: false },
  { flatNo: "108H", name: "DHEERAJ", isOwner: false, isTenant: false },
  { flatNo: "108I", name: "ROSHIN", isOwner: true, isTenant: false },
  { flatNo: "108I", name: "REMANI", isOwner: false, isTenant: false },
  { flatNo: "108I", name: "SHILPA", isOwner: false, isTenant: false },
  { flatNo: "108I", name: "NAVNI", isOwner: false, isTenant: false },
  { flatNo: "108J", name: "ANANTHU", isOwner: false, isTenant: true },
  { flatNo: "108J", name: "KALPANA", isOwner: false, isTenant: true },
  { flatNo: "108K", name: "RISANA", isOwner: false, isTenant: true },
  { flatNo: "108K", name: "JASEEL", isOwner: false, isTenant: true },
  { flatNo: "108L", name: "", isOwner: true, isTenant: false },
  { flatNo: "108M", name: "ROHITH", isOwner: false, isTenant: true },
  { flatNo: "108M", name: "RIYA", isOwner: false, isTenant: true },

  // Floor 9
  { flatNo: "109X", name: "", isOwner: true, isTenant: false },
  { flatNo: "109Y", name: "", isOwner: true, isTenant: false },
  { flatNo: "109Z", name: "", isOwner: true, isTenant: false },

  // Floor 10
  { flatNo: "110G", name: "RENJITH", isOwner: false, isTenant: true },
  { flatNo: "110G", name: "DEVIKA", isOwner: false, isTenant: true },
  { flatNo: "110H", name: "", isOwner: true, isTenant: false },
  { flatNo: "110I", name: "", isOwner: true, isTenant: false },
  { flatNo: "110J", name: "ARJUN", isOwner: false, isTenant: true },
  { flatNo: "110K", name: "ATHIRA", isOwner: false, isTenant: true },
  { flatNo: "110L", name: "ADWAITH", isOwner: true, isTenant: false },
  { flatNo: "110L", name: "ANAND", isOwner: false, isTenant: false },
  { flatNo: "110L", name: "NISHA", isOwner: false, isTenant: false },
  { flatNo: "110M", name: "DEEPTHI", isOwner: true, isTenant: false },
  { flatNo: "110M", name: "ADV SURAJ KRISHNA", isOwner: false, isTenant: false },
  { flatNo: "110M", name: "SNIGDHA", isOwner: false, isTenant: false },

  // Floor 11
  { flatNo: "111O", name: "CHAKKEEMALAVIKA", isOwner: false, isTenant: true },
  { flatNo: "111P", name: "PETER LUGG", isOwner: true, isTenant: false },
  { flatNo: "111P", name: "SHEILA LUGG", isOwner: false, isTenant: false },
  { flatNo: "111Q", name: "LAKSHMAN", isOwner: true, isTenant: false },
  { flatNo: "111Q", name: "HABEEB", isOwner: false, isTenant: false },
  { flatNo: "111R", name: "", isOwner: true, isTenant: false },
  { flatNo: "111S", name: "TINJU", isOwner: true, isTenant: false },
  { flatNo: "111S", name: "LENA", isOwner: false, isTenant: false },
  { flatNo: "111S", name: "LIYA", isOwner: false, isTenant: false },
  { flatNo: "111S", name: "ANTONY", isOwner: false, isTenant: false },

  // Floor 12
  { flatNo: "112O", name: "KURIEN GEORGE", isOwner: true, isTenant: false },
  { flatNo: "112O", name: "MATHEW GEORGE", isOwner: false, isTenant: false },
  { flatNo: "112P", name: "MANU", isOwner: false, isTenant: true },
  { flatNo: "112P", name: "ANU", isOwner: false, isTenant: true },
  { flatNo: "112P", name: "PAILY", isOwner: false, isTenant: true },
  { flatNo: "112P", name: "PRANAV", isOwner: false, isTenant: true },
  { flatNo: "112Q", name: "SALI THASHNATH", isOwner: true, isTenant: false },
  { flatNo: "112Q", name: "SHENNU", isOwner: false, isTenant: false },
  { flatNo: "112R", name: "SANNU MATHEW", isOwner: true, isTenant: false },
  { flatNo: "112R", name: "NISHA", isOwner: false, isTenant: false },
  { flatNo: "112R", name: "YANET", isOwner: false, isTenant: false },
  { flatNo: "112S", name: "ROHAN BOBBY", isOwner: false, isTenant: true },
  { flatNo: "112S", name: "TASHINA", isOwner: false, isTenant: true },
  { flatNo: "112S", name: "KEN ROHAN", isOwner: false, isTenant: true },

  // Floor 13
  { flatNo: "113I", name: "AFZAL", isOwner: false, isTenant: true },
  { flatNo: "113I", name: "ANSEERA", isOwner: false, isTenant: true },
  { flatNo: "113O", name: "ARAVIND", isOwner: false, isTenant: true },
  { flatNo: "113P", name: "ALEXANDER GEORGE", isOwner: true, isTenant: false },
  { flatNo: "113P", name: "JAYA", isOwner: false, isTenant: false },
  { flatNo: "113R", name: "", isOwner: true, isTenant: false },
  { flatNo: "113T", name: "VEENA", isOwner: true, isTenant: false },
  { flatNo: "113T", name: "RAMESH", isOwner: false, isTenant: false },

  // Floor 14
  { flatNo: "114H", name: "", isOwner: true, isTenant: false },
  { flatNo: "114I", name: "", isOwner: true, isTenant: false },
  { flatNo: "114K", name: "AKSHAY", isOwner: false, isTenant: true },
  { flatNo: "114K", name: "SHEETHAL", isOwner: false, isTenant: true },
  { flatNo: "114M", name: "ADV ASIF NIZAR", isOwner: true, isTenant: false },
  { flatNo: "114M", name: "SAFA", isOwner: false, isTenant: false },
  { flatNo: "114O", name: "VENUGOPAL", isOwner: true, isTenant: false },
  { flatNo: "114O", name: "DEVIKA", isOwner: false, isTenant: false },
  { flatNo: "114U", name: "BHARATH CHANDRAN", isOwner: true, isTenant: false },
  { flatNo: "114U", name: "NAVEEN", isOwner: false, isTenant: false },

  // Floor 15
  { flatNo: "115N", name: "", isOwner: true, isTenant: false },
];

// Staff members
const staffMembers = [
  { name: "SUJITH", role: "watchman" },
  { name: "KHIMANADA", role: "watchman" },
  { name: "VARGHESE", role: "watchman" },
  { name: "RAVINDRA", role: "watchman" },
  { name: "AMMINI", role: "watchman" },
  { name: "REMANI", role: "watchman" },
];

export async function createResidents() {
  const defaultPassword = "Skymax123";
  const hashedPassword = await hashPassword(defaultPassword);

  console.log("Creating resident accounts...");

  // Create residents
  for (const resident of buildingResidents) {
    if (resident.name.trim() === "") continue; // Skip empty entries

    const nameParts = resident.name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "";
    
    const username = resident.flatNo.toLowerCase();
    const email = `${username}@ultraskymax.com`;

    try {
      await db.insert(users).values({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        unitNumber: resident.flatNo,
        role: "resident",
        status: "active", // Activate all residents by default
        isOwner: resident.isOwner,
      });

      console.log(`Created account for ${resident.name} (${username})`);
    } catch (error) {
      console.log(`Account for ${resident.name} (${username}) already exists or error occurred`);
    }
  }

  // Create staff accounts
  for (const staff of staffMembers) {
    const nameParts = staff.name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "";
    
    const username = `staff_${firstName.toLowerCase()}`;
    const email = `${username}@ultraskymax.com`;

    try {
      await db.insert(users).values({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: staff.role as any,
        status: "active",
        isOwner: false,
      });

      console.log(`Created staff account for ${staff.name} (${username})`);
    } catch (error) {
      console.log(`Staff account for ${staff.name} (${username}) already exists or error occurred`);
    }
  }

  console.log("Resident creation completed!");
  console.log("\nDefault login credentials:");
  console.log("Username: [flat number] (e.g., 101a, 102b)");
  console.log("Password: Skymax123");
  console.log("\nStaff usernames: staff_sujith, staff_khimanada, etc.");
}

// Run the script
createResidents().then(() => {
  console.log("All residents created successfully!");
  process.exit(0);
}).catch((error) => {
  console.error("Error creating residents:", error);
  process.exit(1);
});