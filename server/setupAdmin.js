const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline/promises'); // <-- Use the promise-based version
const User = require('./models/User');

// --- Your MongoDB Connection String ---
const MONGO_URI = "mongodb+srv://temp_admin:Webflare123@cluster1.xe94ros.mongodb.net/webflare_db?retryWrites=true&w=majority&appName=Cluster1";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const createAdmin = async () => {
  try {
    console.log('Connecting to the database...');
    await mongoose.connect(MONGO_URI);
    console.log('Successfully connected to MongoDB.');

    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('An admin user already exists. Aborting setup.');
      return; // Exit the function early
    }

    console.log('\n--- Creating First Admin User ---');

    // Use await to pause the script and wait for user input
    const name = await rl.question('Enter admin full name: ');
    const email = await rl.question('Enter admin email: ');
    const password = await rl.question('Enter admin password: ');

    console.log('\nCreating user...');

    const newUser = new User({ name, email });

    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(password, salt);

    await newUser.save();

    console.log('✅ Admin user created successfully!');

  } catch (err) {
    console.error('Error during admin setup:', err);
  } finally {
    // This block ensures the connection and readline interface always close
    mongoose.connection.close();
    rl.close();
  }
};

createAdmin();