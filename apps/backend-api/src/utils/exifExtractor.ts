import fs from 'fs';
import exifParser from 'exif-parser';

export interface ExifMetadata {
  latitude: number | null;
  longitude: number | null;
  timestamp: Date | null;
  cameraModel: string | null;
}

export function extractExif(filePath: string): ExifMetadata {
  try {
    if (!fs.existsSync(filePath)) {
      return { latitude: null, longitude: null, timestamp: null, cameraModel: null };
    }

    const buffer = fs.readFileSync(filePath);
    const parser = exifParser.create(buffer);
    const result = parser.parse();

    const latitude = result.tags.GPSLatitude || null;
    const longitude = result.tags.GPSLongitude || null;
    const timestamp = result.tags.DateTimeOriginal ? new Date(result.tags.DateTimeOriginal * 1000) : null;
    const cameraModel = result.tags.Model || null;

    return { latitude, longitude, timestamp, cameraModel };
  } catch (error) {
    console.error('Error parsing EXIF headers:', error);
    return { latitude: null, longitude: null, timestamp: null, cameraModel: null };
  }
}
