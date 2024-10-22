const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const readline = require('readline');     // core node.js function


// Helper function to manually parse each row based on index
const extractColumnsFromCsv = (filePath) => {
  return new Promise((resolve, reject) => {
    let extractedData = [];
    let lineNumber = 0;

    // Create a read stream to process CSV line by line
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      lineNumber++;

      // Split the line by commas (handling CSV format)
      const row = line.split(',');

      // Log each line for debugging purposes
      console.log(`Line ${lineNumber}:`, row);

      // Skip header lines or invalid lines if needed
      if (row.length < 30) {    // total 30 column
        console.log(`Skipping line ${lineNumber}: Not enough columns`);
        return; // Skip lines that don't match the expected column count
      }

      // Extract data from the defined columns
      const col = {
        'trxn_date': row[3] || null,        // Column D
        'sku_id': row[9] || null,           // Column J
        'sku_name': row[12] || null,        // Column M
        'qty': row[19] || null              // Column S (corrected to 19)
      };

      console.log('Filtered Row:', col);    // Log the filtered row before adding it to the array
      if ( col['sku_id']  &&  col['sku_name']  &&  col['qty']) {   extractedData.push(col);   }     // Only push valid rows that have at least one valid column
    });

    rl.on('close', () => {
      console.log('CSV file processing complete.');
      resolve(extractedData);  // Return extracted data when parsing is complete
    });

    rl.on('error', (err) => {
      console.error('Error while processing CSV file:', err);
      reject(err);  // Handle any errors
    });
  });
};

// Vercel API handler for file upload and CSV processing
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Error parsing file upload:', err);
        return res.status(500).json({ error: 'Error parsing the file upload' });
      }

      const filePath = files.file.filepath; // Get the path to the uploaded file

      // Log the file path
      console.log('File uploaded:', filePath);

      // Extract columns from the uploaded CSV file
      extractColumnsFromCsv(filePath)
        .then((data) => {
          console.log('Extracted Data:', data);
          res.status(200).json({ extractedData: data });
        })
        .catch((error) => {
          console.error('Error extracting columns from CSV:', error);
          res.status(500).json({ error: 'Error processing the CSV file' });
        });
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' }); // Only allow POST requests
  }
}











/*
// -----------------
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

export const config = {
  api: {
    bodyParser: false, // Disable default body parser to handle file uploads manually
  },
};

// Vercel API handler for file upload and CSV processing
export default async function handler__notWork(req, res) {
  if (req.method === 'POST') {
    const form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Error parsing file upload:', err);
        return res.status(500).json({ error: 'Error parsing the file upload' });
      }

      const filePath = files.file.filepath; // Get the path to the uploaded file

      // Log the file path
      console.log('File uploaded:', filePath);

      // Extract columns from the uploaded CSV file
      extractColumnsFromCsv(filePath)
        .then((data) => {
          console.log('Extracted Data:', data);
          res.status(200).json({ extractedData: data });
        })
        .catch((error) => {
          console.error('Error extracting columns from CSV:', error);
          res.status(500).json({ error: 'Error processing the CSV file' });
        });
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' }); // Only allow POST requests
  }
}

// Function to extract the desired columns from the CSV with added logging
const extractColumnsFromCsv__notWork = (filePath) => {
  return new Promise((resolve, reject) => {
    let extractedData = [];

    // Log the file being processed
    console.log(`Processing file: ${filePath}`);

    // Exact column mappings (these are the CSV fields, not Excel columns)
    const columnMappings = {
      3: 'trxn date',     // 'D': Sales Date
      10: 'sku id',       // 'J': STOCK CODE
      13: 'sku name',     // 'M': DESCRIPTION
      20: 'qty',          // 'T': Qty
    };

    // Log the columns we are extracting
    console.log('Extracting columns:', columnMappings);

    // Read and parse the CSV file
    let isValidRow = false;
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ',' })) // Specify comma separator for the CSV
      .on('data', (row) => {
        // Log each row as it is read
        console.log('Raw Row --> ', row, '  >> SKU: ', row[10], ', DESC:', row[13], ', QTY: ', row[20]);

        // Identify valid rows by checking specific columns
        if (row[3] || row[10] || row[13] || row[20]) {
           isValidRow = true;  // Valid data starts here
        }

        if (isValidRow) {
          const col = {
            'trxn date' : row[3] || null,       // Column D (Sales Date)
            'sku id'    : row[10] || null,      // Column J (STOCK CODE)
            'sku name'  : row[13] || null,      // Column M (DESCRIPTION)
            'qty'       : row[20] || null       // Column S (Qty)
          };

          // Log the filtered row before adding it to the array
          console.log('Filtered Row:', col);

          // Push rows that have at least one valid column
          if (col['trxn date'] || col['sku id'] || col['sku name'] || col['qty']) {
            extractedData.push(col);
          }
        }
      })
      .on('end', () => {
        console.log('CSV file processing complete.');
        resolve(extractedData);  // Return extracted data when parsing is complete
      })
      .on('error', (err) => {
        console.error('Error while processing CSV file:', err);
        reject(err);  // Handle any errors
      });
  });
};


// */
