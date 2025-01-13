import express from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';


const app = express();
const JWT_SECRET="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IklyaXNhIiwiaWF0IjoxNTE2MjM5MDIyfQ.rUZmn1bcj2SSpDgymVtuUz2-MacHC_GUUHl4yJes6eE" // In a real application, this should be an environment variable

app.use(express.json());
app.use(cors());

//Database setup
const pool =new pg.Pool({
    user: 'postgres',
    host:'localhost',
    database:'rtb_equipment',
    password:'irisa',
    port:5432
});

const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'RTB Equipment Distribution API',
        version: '1.0.0',
        description: 'API for managing equipment distribution',
      },
      servers: [
        {
          url: 'http://localhost:3002',
        },
      ],
    },
    apis: ['./server.js'], // Path to the API docs
  };

  const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

async function initDB(){
    const client= await pool.connect();
    try{
        await client.query(`
               CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        firstname VARCHAR(255) NOT NULL,
        lastname VARCHAR(255) NOT NULL,
        national_identity VARCHAR(255) NOT NULL,
        telephone VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        department VARCHAR(255) NOT NULL,
        position VARCHAR(255) NOT NULL,
        laptop_manufacturer VARCHAR(255) NOT NULL,
        model VARCHAR(255) NOT NULL,
        serial_number VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
            
            `);
            console.log('Database initialized');
    }catch(err){
        console.error('Error initializing database', err);
    }finally{
        client.release()
    }
}
initDB();

const users= [];
const employees =[];

const validateEmployee=[
    body('firstname').notEmpty().trim(),
    body('lastname').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('nationalIdentity').notEmpty(),
    body('telephone').notEmpty(),
    body('department').notEmpty(),
    body('position').notEmpty(),
    body('laptopManufacturer').notEmpty(),
    body('model').notEmpty(),
    body('serialNumber').notEmpty()
];

//Auth midleware

// const authenticateToken=(req,res,next) =>{
//     const authHeader =req.headers['authorization']
//     const token = authHeader && authHeader.split(' ')[1];

//     if(!token) return res.sendStatus(401);
//     jwt.verify(token, process.env.JWT_SECRET, (err,user)=>{
//         if (err) return res.sendStatus(403);
//         req.user = user;
//         next();


//     });
// };

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
        req.user = user;
        next();
    });
};


//Routes

app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
  });


// Swagger documentation for routes
/**
 * @swagger
 * /api/signup:
 *   post:
 *     summary: Create a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: User already exists
 *       500:
 *         description: Server error
 */

app.post('/api/signup', async (req, res)=>{
    try {
        const {email, password} = req.body;

        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1',[email]);

        if (userCheck.rows.length > 0){
           return res.status(400).json({message: 'User already exists'});
        }

        //hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        //Save user

        await pool.query('INSERT INTO users (email, password) VALUES ($1,$2)',[email,hashedPassword]);
        res .status(201).json({message: 'User created sucessfully'});
    }catch(error){
        console.error(error);
        res.status(500).json({message: 'Server error'})
    }
});
/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Login to get a JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */




app.post('/api/login', async (req, res)=>{
    try {
        const {email, password} =req.body;
        const result=await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if(!user || !(await bcrypt.compare(password, user.password))){
            return res.status(401).json({message:'Invalid credentials'});
        }

        const token =jwt.sign({email, isAdmin: user.isAdmin},JWT_SECRET, {expiresIn:'1h'});
        res.json({token});
    }catch(error){
        res.status(500).json({message: 'Server error'})
    }
});
/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Add a new employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstname
 *               - lastname
 *               - nationalIdentity
 *               - telephone
 *               - email
 *               - department
 *               - position
 *               - laptopManufacturer
 *               - model
 *               - serialNumber
 *             properties:
 *               firstname:
 *                 type: string
 *               lastname:
 *                 type: string
 *               nationalIdentity:
 *                 type: string
 *               telephone:
 *                 type: string
 *               email:
 *                 type: string
 *               department:
 *                 type: string
 *               position:
 *                 type: string
 *               laptopManufacturer:
 *                 type: string
 *               model:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Employee added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

app.post('/api/employees', authenticateToken, validateEmployee, async (req, res)=>{
    const errors= validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    try {
        const { firstname, lastname, nationalIdentity, telephone, email, department, position, laptopManufacturer, model, serialNumber } = req.body;
    
        const result = await pool.query(
          'INSERT INTO employees (firstname, lastname, national_identity, telephone, email, department, position, laptop_manufacturer, model, serial_number) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
          [firstname, lastname, nationalIdentity, telephone, email, department, position, laptopManufacturer, model, serialNumber]
        );
    
        res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
      }
});

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Get a list of employees
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of employees
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       firstname:
 *                         type: string
 *                       lastname:
 *                         type: string
 *                       email:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

app.get('/api/employees', authenticateToken,async (req, res)=>{
  try{
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM employees');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query('SELECT * FROM employees ORDER BY id LIMIT $1 OFFSET $2', [limit, offset]);
    
    res.json({
      data: result.rows,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Swagger security definition
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));