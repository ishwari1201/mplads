declare module 'exif-parser' {
  export interface ExifTags {
    GPSLatitude?: number;
    GPSLongitude?: number;
    DateTimeOriginal?: number;
    Model?: string;
    [key: string]: any;
  }
  export interface ExifResult {
    tags: ExifTags;
    [key: string]: any;
  }
  export interface Parser {
    parse(): ExifResult;
  }
  export function create(buffer: Buffer): Parser;
}
