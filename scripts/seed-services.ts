import sqlite3 from 'sqlite3';

const dbPath = './tower-connect.db';
const sqlite = new sqlite3.Database(dbPath);

const sampleServices = [
  // Ironing Services
  {
    name: "Quick Press Laundry",
    category: "ironing",
    phone: "+91-98765-43210",
    description: "Professional ironing and pressing services. Pickup and delivery available.",
    address: "Shop No. 15, Ground Floor, Tower A",
    distanceKm: 0.1,
    latitude: 19.0760,
    longitude: 72.8777
  },
  {
    name: "Express Ironing",
    category: "ironing",
    phone: "+91-98765-43211",
    description: "Same day ironing service. Special rates for bulk orders.",
    address: "Near Gate 2, Commercial Complex",
    distanceKm: 0.2,
    latitude: 19.0761,
    longitude: 72.8778
  },

  // Milk Services
  {
    name: "Amul Milk Center",
    category: "milk",
    phone: "+91-98765-43212",
    description: "Fresh milk delivery daily. Available in 500ml, 1L, and 2L packs.",
    address: "Shop No. 8, Ground Floor, Tower B",
    distanceKm: 0.05,
    latitude: 19.0759,
    longitude: 72.8776
  },
  {
    name: "Mother Dairy",
    category: "milk",
    phone: "+91-98765-43213",
    description: "Organic milk and dairy products. Morning and evening delivery.",
    address: "Commercial Complex, Near Parking",
    distanceKm: 0.15,
    latitude: 19.0762,
    longitude: 72.8779
  },

  // Internet Services
  {
    name: "Jio Fiber",
    category: "internet",
    phone: "+91-98765-43214",
    description: "High-speed fiber internet. Plans starting from 30 Mbps.",
    address: "Service Center, Ground Floor",
    distanceKm: 0.0,
    latitude: 19.0760,
    longitude: 72.8777
  },
  {
    name: "Airtel Xstream",
    category: "internet",
    phone: "+91-98765-43215",
    description: "Fiber broadband with entertainment bundle. 24/7 support.",
    address: "Near Security Office",
    distanceKm: 0.1,
    latitude: 19.0761,
    longitude: 72.8778
  },

  // Cable/DTH Services
  {
    name: "Tata Sky",
    category: "cable",
    phone: "+91-98765-43216",
    description: "DTH services with HD channels. Installation and maintenance.",
    address: "Authorized Dealer, Commercial Complex",
    distanceKm: 0.2,
    latitude: 19.0763,
    longitude: 72.8780
  },
  {
    name: "Dish TV",
    category: "cable",
    phone: "+91-98765-43217",
    description: "Affordable DTH packages. Quick installation service.",
    address: "Shop No. 12, Ground Floor",
    distanceKm: 0.15,
    latitude: 19.0762,
    longitude: 72.8779
  },

  // Electrician Services
  {
    name: "Spark Electric",
    category: "electrician",
    phone: "+91-98765-43218",
    description: "Licensed electrician. 24/7 emergency service available.",
    address: "Service Provider Network",
    distanceKm: 0.5,
    latitude: 19.0765,
    longitude: 72.8782
  },
  {
    name: "Power Solutions",
    category: "electrician",
    phone: "+91-98765-43219",
    description: "Electrical repairs and installations. Certified professionals.",
    address: "Nearby Commercial Area",
    distanceKm: 0.8,
    latitude: 19.0768,
    longitude: 72.8785
  },

  // Plumbing Services
  {
    name: "Flow Masters",
    category: "plumbing",
    phone: "+91-98765-43220",
    description: "Plumbing repairs and installations. Emergency service available.",
    address: "Service Provider Network",
    distanceKm: 0.6,
    latitude: 19.0766,
    longitude: 72.8783
  },
  {
    name: "Pipe Pro",
    category: "plumbing",
    phone: "+91-98765-43221",
    description: "Expert plumbing services. Water tank cleaning and maintenance.",
    address: "Nearby Area",
    distanceKm: 1.0,
    latitude: 19.0770,
    longitude: 72.8787
  },

  // Carpenter Services
  {
    name: "Wood Craft",
    category: "carpenter",
    phone: "+91-98765-43222",
    description: "Furniture repair and custom woodwork. Professional carpenters.",
    address: "Workshop in nearby area",
    distanceKm: 1.2,
    latitude: 19.0772,
    longitude: 72.8789
  },

  // Appliance Repair
  {
    name: "Fix It Fast",
    category: "appliance-repair",
    phone: "+91-98765-43223",
    description: "AC, refrigerator, washing machine repair. Authorized service center.",
    address: "Service Center, Commercial Complex",
    distanceKm: 0.3,
    latitude: 19.0764,
    longitude: 72.8781
  },

  // RO/Water Purifier
  {
    name: "Pure Water Solutions",
    category: "RO/water-purifier",
    phone: "+91-98765-43224",
    description: "RO installation, maintenance, and filter replacement.",
    address: "Authorized Dealer",
    distanceKm: 0.4,
    latitude: 19.0765,
    longitude: 72.8782
  },

  // Gas/Stove Service
  {
    name: "Gas Safe",
    category: "gas/stove-service",
    phone: "+91-98765-43225",
    description: "Gas cylinder delivery and stove repair services.",
    address: "Gas Agency, Nearby Area",
    distanceKm: 0.7,
    latitude: 19.0767,
    longitude: 72.8784
  },

  // Pest Control
  {
    name: "Pest Free",
    category: "pest-control",
    phone: "+91-98765-43226",
    description: "Professional pest control services. Safe for children and pets.",
    address: "Service Provider",
    distanceKm: 0.9,
    latitude: 19.0769,
    longitude: 72.8786
  },

  // Painter
  {
    name: "Color Masters",
    category: "painter",
    phone: "+91-98765-43227",
    description: "Interior and exterior painting. Color consultation available.",
    address: "Painting Contractors",
    distanceKm: 1.1,
    latitude: 19.0771,
    longitude: 72.8788
  },

  // AC Service
  {
    name: "Cool Care",
    category: "AC-service",
    phone: "+91-98765-43228",
    description: "AC installation, repair, and maintenance. Gas refilling service.",
    address: "AC Service Center",
    distanceKm: 0.6,
    latitude: 19.0766,
    longitude: 72.8783
  },

  // Laundry
  {
    name: "Fresh & Clean",
    category: "laundry",
    phone: "+91-98765-43229",
    description: "Dry cleaning and laundry services. Pickup and delivery.",
    address: "Shop No. 20, Ground Floor",
    distanceKm: 0.1,
    latitude: 19.0761,
    longitude: 72.8778
  },

  // Tiffin/Meal Service
  {
    name: "Home Food",
    category: "tiffin/meal-service",
    phone: "+91-98765-43230",
    description: "Home-cooked meals delivered daily. Vegetarian and non-vegetarian options.",
    address: "Home Kitchen Service",
    distanceKm: 0.3,
    latitude: 19.0764,
    longitude: 72.8781
  },

  // Maid/Cook
  {
    name: "Help at Home",
    category: "maid/cook",
    phone: "+91-98765-43231",
    description: "Verified maids and cooks. Background checked professionals.",
    address: "Domestic Help Agency",
    distanceKm: 0.5,
    latitude: 19.0765,
    longitude: 72.8782
  },

  // Driver
  {
    name: "Safe Drive",
    category: "driver",
    phone: "+91-98765-43232",
    description: "Professional drivers for hire. Daily, weekly, and monthly contracts.",
    address: "Driver Agency",
    distanceKm: 0.8,
    latitude: 19.0768,
    longitude: 72.8785
  },

  // Auto/Taxi
  {
    name: "Quick Ride",
    category: "auto/taxi",
    phone: "+91-98765-43233",
    description: "Auto rickshaw and taxi services. 24/7 availability.",
    address: "Stand near Gate 1",
    distanceKm: 0.05,
    latitude: 19.0759,
    longitude: 72.8776
  },

  // Courier
  {
    name: "Express Courier",
    category: "courier",
    phone: "+91-98765-43234",
    description: "Domestic and international courier services. Pickup from home.",
    address: "Courier Center, Ground Floor",
    distanceKm: 0.1,
    latitude: 19.0761,
    longitude: 72.8778
  },

  // Pharmacy
  {
    name: "Health First",
    category: "pharmacy",
    phone: "+91-98765-43235",
    description: "24/7 pharmacy. All medicines available. Home delivery.",
    address: "Shop No. 5, Ground Floor",
    distanceKm: 0.05,
    latitude: 19.0759,
    longitude: 72.8776
  },

  // Clinic
  {
    name: "Family Clinic",
    category: "clinic",
    phone: "+91-98765-43236",
    description: "General physician. Morning and evening consultations.",
    address: "Clinic, First Floor",
    distanceKm: 0.0,
    latitude: 19.0760,
    longitude: 72.8777
  },

  // Hospital
  {
    name: "City Hospital",
    category: "hospital",
    phone: "+91-98765-43237",
    description: "Multi-specialty hospital. Emergency services available.",
    address: "Main Road, 2 km away",
    distanceKm: 2.0,
    latitude: 19.0780,
    longitude: 72.8797
  },

  // Pathology
  {
    name: "Lab Care",
    category: "pathology",
    phone: "+91-98765-43238",
    description: "Blood tests and pathology services. Home collection available.",
    address: "Pathology Lab, Ground Floor",
    distanceKm: 0.1,
    latitude: 19.0761,
    longitude: 72.8778
  },

  // Fruits & Vegetables
  {
    name: "Fresh Mart",
    category: "fruits-vegetables",
    phone: "+91-98765-43239",
    description: "Fresh fruits and vegetables. Daily delivery available.",
    address: "Shop No. 10, Ground Floor",
    distanceKm: 0.05,
    latitude: 19.0759,
    longitude: 72.8776
  },

  // Grocery
  {
    name: "Daily Needs",
    category: "grocery",
    phone: "+91-98765-43240",
    description: "Complete grocery store. All household items available.",
    address: "Shop No. 1-3, Ground Floor",
    distanceKm: 0.0,
    latitude: 19.0760,
    longitude: 72.8777
  },

  // Bakery
  {
    name: "Sweet Dreams",
    category: "bakery",
    phone: "+91-98765-43241",
    description: "Fresh bread, cakes, and pastries. Custom orders welcome.",
    address: "Shop No. 7, Ground Floor",
    distanceKm: 0.05,
    latitude: 19.0759,
    longitude: 72.8776
  },

  // Stationery
  {
    name: "Book World",
    category: "stationery",
    phone: "+91-98765-43242",
    description: "School supplies, books, and stationery items.",
    address: "Shop No. 18, Ground Floor",
    distanceKm: 0.1,
    latitude: 19.0761,
    longitude: 72.8778
  },

  // Mobile Repair
  {
    name: "Phone Fix",
    category: "mobile-repair",
    phone: "+91-98765-43243",
    description: "Mobile phone repair and service. All brands supported.",
    address: "Shop No. 25, Ground Floor",
    distanceKm: 0.1,
    latitude: 19.0761,
    longitude: 72.8778
  },

  // Hardware
  {
    name: "Tool Store",
    category: "hardware",
    phone: "+91-98765-43244",
    description: "Hardware and tools. Electrical and plumbing supplies.",
    address: "Hardware Store, Nearby Area",
    distanceKm: 0.8,
    latitude: 19.0768,
    longitude: 72.8785
  },

  // Photo Copy/Print
  {
    name: "Print Express",
    category: "photo-copy/print",
    phone: "+91-98765-43245",
    description: "Photocopy, printing, and document services.",
    address: "Shop No. 22, Ground Floor",
    distanceKm: 0.1,
    latitude: 19.0761,
    longitude: 72.8778
  },

  // Salon/Parlour
  {
    name: "Beauty Zone",
    category: "salon/parlour",
    phone: "+91-98765-43246",
    description: "Haircut, styling, and beauty services. Ladies and gents.",
    address: "Shop No. 30, First Floor",
    distanceKm: 0.0,
    latitude: 19.0760,
    longitude: 72.8777
  },

  // Temple/Church/Mosque
  {
    name: "Community Temple",
    category: "temple/church/mosque",
    phone: "+91-98765-43247",
    description: "Community prayer hall. Open for all religions.",
    address: "Community Center, Ground Floor",
    distanceKm: 0.0,
    latitude: 19.0760,
    longitude: 72.8777
  },

  // Bank/ATM
  {
    name: "State Bank ATM",
    category: "bank/atm",
    phone: "+91-98765-43248",
    description: "24/7 ATM services. Cash withdrawal and balance inquiry.",
    address: "ATM Center, Ground Floor",
    distanceKm: 0.0,
    latitude: 19.0760,
    longitude: 72.8777
  }
];

async function seedServices() {
  console.log('Seeding nearby services...');
  
  for (const service of sampleServices) {
    const id = `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await new Promise((resolve, reject) => {
      sqlite.run(`
        INSERT INTO nearby_services (
          id, name, category, phone, description, address, distanceKm, latitude, longitude, isActive
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, service.name, service.category, service.phone, service.description,
        service.address, service.distanceKm, service.latitude, service.longitude, 1
      ], (err) => {
        if (err) {
          console.error('Error inserting service:', err);
          reject(err);
        } else {
          console.log(`Added service: ${service.name} (${service.category})`);
          resolve(true);
        }
      });
    });
  }
  
  console.log('Services seeding completed!');
  sqlite.close();
}

seedServices().catch(console.error);
