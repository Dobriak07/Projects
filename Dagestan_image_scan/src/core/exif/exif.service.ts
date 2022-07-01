/*  
    heic - DateTime?.description
    jpg/jpeg - DateTime?.description
    png - DateCreated?.value
    tiff - ?
*/

import * as ExifReader from 'exifreader';
import { readFile, stat } from 'node:fs/promises';

interface ExifInfo {
    date: string,
    latitude: string,
    longitude: string
}

export async function exifReader(filePath: string) {
    try {
        let exifInfo: ExifInfo = {
            date: '',
            latitude: '',
            longitude: ''
        };
        let imageBuf: Buffer = await readFile(filePath);
        let metaData = ExifReader.load(imageBuf);
        exifInfo.date = metaData.DateTime?.description ? metaData.DateTime.description : 
                   metaData.DateCreated?.value ? metaData.DateCreated.value : 
                   (await stat(filePath)).birthtime.toISOString();
    
        exifInfo.latitude = metaData.GPSLatitude ? metaData.GPSLatitude.description : '';
        exifInfo.longitude = metaData.GPSLongitude ? metaData.GPSLongitude.description : '';
        return { exifInfo, imageBuf };
    }
    catch(err) {
        throw err;
    }
}