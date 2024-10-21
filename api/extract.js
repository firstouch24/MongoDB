const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

export const config = {
  api: {
    bodyParser: false, // Disable default body parsing to handle file uploads
  },
};

// Function to extract the desired columns from the CSV
const extractColumnsFromCsv = (filePath) => {
  return new Promise((resolve, reject) => {
    const extractedData = [];

    // Exact column mappings based on the user's provided CSV template
    const columnMappings = {
      'D': 'trxn date',    // Sales Date
      'J': 'sku id',       // STOCK CODE
      'M': 'sku name',     // DESCRIPTION
      'S': 'qty',          // Qty
    };

    let isValidRow = false;

    fs.createReadStream(filePath)
      .pipe(csv({ separator: ',' })) // Specify comma separator for the CSV
      .on('data', (row) => {
        // Identify valid rows by checking specific columns
        if (row['D'] || row['J'] || row['M'] || row['S']) {
          isValidRow = true;  // Valid data starts here
        }

        if (isValidRow) {
          const filteredRow = {
            'trxn date': row['D'] || null,     // Column D (Sales Date)
            'sku id': row['J'] || null,        // Column J (STOCK CODE)
            'sku name': row['M'] || null,      // Column M (DESCRIPTION)
            'qty': row['S'] || null,           // Column S (Qty)
          };

          // Push rows that have at least one valid column
          if (filteredRow['trxn date'] || filteredRow['sku id'] || filteredRow['sku name'] || filteredRow['qty']) {
            extractedData.push(filteredRow);
          }
        }
      })
      .on('end', () => {
        resolve(extractedData);  // Return extracted data when parsing is complete
      })
      .on('error', (err) => {
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
        return res.status(500).json({ error: 'Error parsing the file upload' });
      }

      const filePath = files.file.filepath; // Get the path to the uploaded file

      // Extract columns from the uploaded CSV file
      extractColumnsFromCsv(filePath)
        .then((data) => {
          res.status(200).json({ extractedData: data });
        })
        .catch((error) => {
          res.status(500).json({ error: 'Error processing the CSV file' });
        });
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' }); // Only allow POST requests
  }
}
