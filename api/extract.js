const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

export const config = {
  api: {
    bodyParser: false, // Disable default body parser to handle file uploads manually
  },
};

// Function to extract the desired columns from the CSV with added logging
const extractColumnsFromCsv = (filePath) => {
  return new Promise((resolve, reject) => {
    const extractedData = [];

    // Log the file being processed
    console.log(`Processing file: ${filePath}`);

    // Exact column mappings (these are the CSV fields, not Excel columns)
    const columnMappings = {
      'D': 'trxn date',    // Sales Date
      'J': 'sku id',       // STOCK CODE
      'M': 'sku name',     // DESCRIPTION
      'S': 'qty',          // Qty
    };

    // Log the columns we are extracting
    console.log('Extracting columns:', columnMappings);

    let isValidRow = false;

    // Read and parse the CSV file
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ',' })) // Specify comma separator for the CSV
      .on('data', (row) => {
        // Log each row as it is read
        console.log('Row:', row);

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

          // Log the filtered row before adding it to the array
          console.log('Filtered Row:', filteredRow);

          // Push rows that have at least one valid column
          if (filteredRow['trxn date'] || filteredRow['sku id'] || filteredRow['sku name'] || filteredRow['qty']) {
            extractedData.push(filteredRow);
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