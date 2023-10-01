const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomId } = require('../commons')
// const ExifBuilder = require('exif').ExifBuilder;
const cors = require('cors');
const sharp = require('sharp');
const piexif = require('piexifjs');

const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,POST,OPTIONS',
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Create an HTTP server to handle incoming requests
const server = http.createServer((request, response) => {
  // console.log(request);
  cors(corsOptions)(request, response, () => {
    if (request.method === 'POST' && request.url === '/upload') {
      let data = '';

      request.on('data', (chunk) => {
        data += chunk;
      });

      request.on('end', () => {
        try {
          const requestData = JSON.parse(data);

          if (requestData.imageBase64 && requestData.comment) {
            saveFile(
              requestData.imageBase64, 
              requestData.comment
            );

            response.writeHead(200, { 'Content-Type': 'text/plain' });
            response.end('Image and comment saved successfully.');
          } 
          else {
            response.writeHead(400, { 'Content-Type': 'text/plain' });
            response.end('Missing imageBase64 or comment in the request.');
          }
        } 
        catch (err) {
          console.error(err);
          response.writeHead(500, { 'Content-Type': 'text/plain' });
          response.end('Internal server error.');
        }
      });
    } 
    else {
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end('Not Found');
    }
  })
});

// Define "the port for the server to listen on
const port = 3000;

// Start the server
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});




function saveFile(imgData, comment) {
  let base64Image = imgData.split(';base64,').pop();
  let imgBuffer = Buffer.from(base64Image, 'base64');

  sharp(imgBuffer)
    .toBuffer()
    .then(data => {
      let zeroth = {};
      let exifObj = {"0th":zeroth};
      zeroth[piexif.ImageIFD.ImageDescription] = comment;
      let exifbytes = piexif.dump(exifObj);

      let newData = piexif.insert(exifbytes, data.toString("binary"));
      let newJpeg = Buffer.from(newData, "binary");

      let fileName = randomId(6) + '.jpg';
      let dirPath = '/home/criston/Desktop/Photos/Newer/AI/';

      fs.writeFile(dirPath + fileName, newJpeg, (err) => {
        if (err) throw err;
        console.log('Saved ' + fileName + ' <' + comment + '>');
      });
    })
    .catch(err => {
      console.log(err);
    });
}

