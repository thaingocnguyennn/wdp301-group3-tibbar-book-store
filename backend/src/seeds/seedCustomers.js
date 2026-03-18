import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import { ROLES } from '../config/constants.js';

dotenv.config();

const testCustomers = [
  {
    email: 'john.doe@example.com',
    password: 'Customer@123',
    firstName: 'John',
    lastName: 'Doe',
    role: ROLES.CUSTOMER,
    phone: '+1234567890',
    isActive: true
  },
  {
    email: 'jane.smith@example.com',
    password: 'Customer@123',
    firstName: 'Jane',
    lastName: 'Smith',
    role: ROLES.CUSTOMER,
    phone: '+1234567891',
    isActive: true
  },
  {
    email: 'bob.manager@example.com',
    password: 'Manager@123',
    firstName: 'Bob',
    lastName: 'Manager',
    role: ROLES.MANAGER,
    phone: '+1234567892',
    isActive: true
  },
  {
    email: 'locked.user@example.com',
    password: 'Locked@123',
    firstName: 'Locked',
    lastName: 'User',
    role: ROLES.CUSTOMER,
    phone: '+1234567893',
    isActive: false
  },
  {
    email: 'emma.wilson@example.com',
    password: 'Customer@123',
    firstName: 'Emma',
    lastName: 'Wilson',
    role: ROLES.CUSTOMER,
    phone: '+1234567894',
    isActive: true
  },
  {
    email: 'michael.brown@example.com',
    password: 'Customer@123',
    firstName: 'Michael',
    lastName: 'Brown',
    role: ROLES.CUSTOMER,
    phone: '+1234567895',
    isActive: true
  },
  {
    email: 'sarah.admin@example.com',
    password: 'Admin@123',
    firstName: 'Sarah',
    lastName: 'Admin',
    role: ROLES.ADMIN,
    phone: '+1234567896',
    isActive: true
  },
  {
    email: 'david.customer@example.com',
    password: 'Customer@123',
    firstName: 'David',
    lastName: 'Customer',
    role: ROLES.CUSTOMER,
    phone: '+1234567897',
    isActive: true
  },
  {
    email: 'lisa.inactive@example.com',
    password: 'Inactive@123',
    firstName: 'Lisa',
    lastName: 'Inactive',
    role: ROLES.CUSTOMER,
    phone: '+1234567898',
    isActive: false
  }
];

const seedCustomers = async () => {
  try {
    await connectDB();

    console.log('🌱 Starting customer seeding...\n');

    let createdCount = 0;
    let existingCount = 0;

    for (const customerData of testCustomers) {
      const existingUser = await User.findOne({ email: customerData.email });

      if (existingUser) {
        console.log(`⏭️  User already exists: ${customerData.email}`);
        existingCount++;
        continue;
      }

      await User.create(customerData);
      console.log(`✅ Created: ${customerData.email} (${customerData.role}) - ${customerData.isActive ? 'Active' : 'Locked'}`);
      createdCount++;
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`   Created: ${createdCount} users`);
    console.log(`   Already existed: ${existingCount} users`);
    console.log(`   Total processed: ${testCustomers.length} users`);
    
    console.log('\n📝 Test Accounts:');
    console.log('   Customers (Active):');
    console.log('   - john.doe@example.com / Customer@123');
    console.log('   - jane.smith@example.com / Customer@123');
    console.log('   - emma.wilson@example.com / Customer@123');
    console.log('   - michael.brown@example.com / Customer@123');
    console.log('   - david.customer@example.com / Customer@123');
    console.log('\n   Other Roles:');
    console.log('   - bob.manager@example.com / Manager@123 (Manager)');
    console.log('   - sarah.admin@example.com / Admin@123 (Admin)');
    console.log('\n   Locked Accounts:');
    console.log('   - locked.user@example.com / Locked@123');
    console.log('   - lisa.inactive@example.com / Inactive@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding customers:', error);
    process.exit(1);
  }
};

seedCustomers();
