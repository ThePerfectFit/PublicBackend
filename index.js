require('dotenv').config();
const express = require('express');
const cors = require('cors'); 
const path = require('path');

const app = express();
const port = 5000;


const mysql = require('mysql2');

const fs    = require('fs');

const ca = fs.readFileSync(path.join(__dirname, 'ca.pem'));

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT, 10) || 28517,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'perfect_fit_db',
  ssl: {
    ca: ca
  },
  sslMode:           'REQUIRED',     
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0
});
app.use(cors()); 
app.use(express.json()); 

let bandSize = 0;
let cupSize = '';
let currentBandSize = 0;
let currentCupSize = '';
let inputValueBand = '';
let inputValueBust = '';
let shape = '';
let distance = '';
let support = '';
let cup = '';
let band = '';
let hook = '';
let strap = '';

app.get('/', (req, res) => {
  res.send('Welcome to the Node.js + MySQL backend!');
});

app.post('/sendSize', (req, res) => {
  bandSize = req.body.bandSize; // Store the received band size in the global variable
  currentBandSize = req.body.bandSize;
  cupSize = req.body.cupSize;  
  currentCupSize = req.body.cupSize;

  // Log the received data
  console.log('Received data:', { bandSize, cupSize });

  // Send a response back to the client
  res.status(200).json({ message: 'Sizes received successfully', bandSize, cupSize });
});

app.post('/sendMeasurements', (req, res) => {
  inputValueBand = req.body.inputValueBand;
  inputValueBust = req.body.inputValueBust;

  // Log the received data
  console.log('Received data:', { inputValueBand, inputValueBust });

  // Send a response back to the client
  res.status(200).json({ message: 'Measurements received successfully', inputValueBand, inputValueBust });
});

app.post('/sendShape', (req, res) => {
  shape = req.body.shape;

  // Log the received data
  console.log('Received data:', { shape });

  // Send a response back to the client
  res.status(200).json({ message: 'Shape received successfully', shape});
});

app.post('/sendDistance', (req, res) => {
  distance = req.body.distance;

  // Log the received data
  console.log('Received data:', { distance });

  // Send a response back to the client
  res.status(200).json({ message: 'Distance received successfully', distance});
});

app.post('/sendSupport', (req, res) => {
  support = req.body.distance;

  // Log the received data
  console.log('Received data:', { support });

  // Send a response back to the client
  res.status(200).json({ message: 'Support received successfully', support});
});

app.post('/sendCup', (req, res) => {
  cup = req.body.cup;

  // Log the received data
  console.log('Received data:', { cup });

  // Send a response back to the client
  res.status(200).json({ message: 'Cup received successfully', cup});
});

app.post('/sendBand', (req, res) => {
  band = req.body.band;

  // Log the received data
  console.log('Received data:', { band });

  // Send a response back to the client
  res.status(200).json({ message: 'Band received successfully', band});
});

app.post('/sendHook', (req, res) => {
  hook = req.body.hook;

  // Log the received data
  console.log('Received data:', { hook });

  // Send a response back to the client
  res.status(200).json({ message: 'Hook received successfully', hook});
});

app.post('/sendStrap', (req, res) => {
  strap = req.body.strap;

  // Log the received data
  console.log('Received data:', { strap });

  // Send a response back to the client
  res.status(200).json({ message: 'Strap received successfully', strap});
});






function getSize() {
  // Reset cupChange for each calculation
  let localCupChange = 0;
  
  // Start with the current values
  let calculatedBandSize = bandSize;
  let calculatedCupSize = cupSize;
  
  console.log('Starting getSize with:', { calculatedBandSize, calculatedCupSize, cup, band, hook });
  
  if (cup == 1) {
    calculatedBandSize -= 2;
    localCupChange += 1;
    console.log('After cup adjustment (small):', { calculatedBandSize, localCupChange });
  } else if (cup == 3) {
    calculatedBandSize += 2;
    localCupChange -= 1;
    console.log('After cup adjustment (large):', { calculatedBandSize, localCupChange });
  }

  if (band == 1) {
    localCupChange -= 1;
    calculatedBandSize += 2;
    console.log('After band adjustment (small):', { calculatedBandSize, localCupChange });
  } else if (band == 3) {
    localCupChange += 1;
    calculatedBandSize -= 2;
    console.log('After band adjustment (large):', { calculatedBandSize, localCupChange });
  } 

  if (hook == 1) {
    calculatedBandSize += 2;
    console.log('After hook adjustment:', { calculatedBandSize, localCupChange });
  }

  // Calculate new cup size
  const cupSizes = ['AA', 'A', 'B', 'C', 'D', 'DD (E)', 'DDD (F)', 'G', 'H', 'I', 'J'];
  let currentIndex = cupSizes.indexOf(calculatedCupSize);
  console.log('Current cup index:', currentIndex, 'Current cup size:', calculatedCupSize);
  
  if (currentIndex === -1) currentIndex = 0;

  let newIndex = currentIndex + localCupChange;
  if (newIndex < 0) newIndex = 0;
  if (newIndex >= cupSizes.length) newIndex = cupSizes.length - 1;
  
  calculatedCupSize = cupSizes[newIndex];
  console.log('New cup index:', newIndex, 'New cup size:', calculatedCupSize);

  // Validate and adjust band size to nearest valid size
  const bandSizes = [28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48];
  
  // Find the closest valid band size
  if (!bandSizes.includes(calculatedBandSize)) {
    calculatedBandSize = bandSizes.reduce((prev, curr) =>
      Math.abs(curr - calculatedBandSize) < Math.abs(prev - calculatedBandSize) ? curr : prev
    );
  }
  
  console.log('Final calculated sizes:', { calculatedBandSize, calculatedCupSize, localCupChange });
  
  return { calculatedBandSize, calculatedCupSize };
}
// Test endpoint to verify getSize logic
app.get('/testGetSize', (req, res) => {
  console.log('=== Testing getSize logic ===');
  console.log('Current global variables:', { bandSize, cupSize, cup, band, hook });
  
  const { calculatedBandSize, calculatedCupSize } = getSize();
  
  res.status(200).json({
    message: 'getSize test completed',
    originalValues: { bandSize, cupSize, cup, band, hook },
    calculatedValues: { calculatedBandSize, calculatedCupSize }
  });
});

// MySQL data retrieval endpoint
app.get('/getMySQLData', (req, res) => {
  console.log('=== getMySQLData called ===');
  console.log('Global variables before getSize():', { bandSize, cupSize, cup, band, hook });
  
  const { calculatedBandSize, calculatedCupSize } = getSize();
  
  console.log('Calculated sizes returned:', { calculatedBandSize, calculatedCupSize });
  console.log('Global variables after getSize():', { bandSize, cupSize, cup, band, hook });
  
  const query = 'SELECT * FROM Bras_Victoria_Secret';

  pool.query(query, (error, results) => {
    if (error) {
      console.error('MySQL error:', error);
      return res.status(500).json({ message: 'Error retrieving data', error: error.message });
    }

    // Filter results to only those containing both calculatedBandSize and calculatedCupSize
    const filteredResults = results.filter(row => {
      const rowBands = (row.band_sizes || "").split(",").map(s => s.trim());
      const rowCups  = (row.cup_sizes || "").split(",").map(s => s.trim());
      return rowBands.includes(String(calculatedBandSize)) && rowCups.includes(calculatedCupSize);
    });

    res.status(200).json({
      message: 'MySQL data retrieved successfully',
      bandSize: calculatedBandSize,
      cupSize: calculatedCupSize,
      currentBandSize: currentBandSize,
      currentCupSize: currentCupSize,
      measuredBandSize: inputValueBand,
      measuredCupSize: inputValueBust,
      data: filteredResults
    });
  });
});


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
