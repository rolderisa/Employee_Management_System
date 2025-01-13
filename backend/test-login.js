import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';

const app = express();
app.use(express.json());

const pool = new pg.Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rtb_equipment',
  password: 'irisa', // Replace with your actual PostgreSQL password
  port: 5432,
});

// Add a JWT secret key
const JWT_SECRET="a0ad63dac1a35cb77a685b511e85fa99b78494662c1c3b6404189c0ed34ee3ff7997eb85f45f5b20eee103171391476155ccd879e8421c02fcfbacb710cf95d1" // In a real application, this should be an environment variable

async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to the database');
    client.release();
  } catch (err) {
    console.error('Error connecting to the database:', err);
  }
}

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log('Query result:', result.rows);

    const user = result.rows[0];

    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isValidPassword);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Use the JWT_SECRET when signing the token
    const token = jwt.sign({ email, isAdmin: user.is_admin }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a simple GET route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  testDatabaseConnection();
});

// Test user creation
async function createTestUser() {
  try {
    const email = 'test@example.com';
    const password = 'testpassword';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await pool.query('INSERT INTO users (email, password) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING', [email, hashedPassword]);
    console.log('Test user created or already exists');
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

createTestUser();