/*  
    heic - DateTime?.description
    jpg/jpeg - DateTime?.description
    png - DateCreated?.value
    tiff - ?
*/

const exif = require('exifreader');
const fs = require('fs');

async function exifReader(filePath) {
    let image = await fs.promises.readFile('/Users/ryuga/Documents/Images/1.png');
    let metaData = exif.load(image);
    console.log(metaData);
    console.log('DateTime',metaData.DateTime?.description);
    console.log('DateTime',metaData.DateCreated?.value);
    console.log('Latitude', metaData.GPSLatitude?.description, metaData.GPSLatitude?.value);
    console.log('Longitude', metaData.GPSLongitude?.description, metaData.GPSLongitude?.value);
    console.log(`${metaData.GPSLatitude?.description} ${metaData.GPSLongitude?.description}`);
}

exifReader();
