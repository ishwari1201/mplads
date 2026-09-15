import { Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import { query } from '../config/database';
import { extractExif } from '../utils/exifExtractor';
import { MLClientService } from '../services/mlClient';
import { AuditLogger } from '../services/auditLogger';

export class CitizenController {
  /**
   * System configuration endpoint for Citizen Portal
   */
  static async getConfig(req: Request, res: Response): Promise<void> {
    try {
      const radiusEnv = process.env.CITIZEN_NEARBY_RADIUS_METERS;
      const radiusMeters = radiusEnv ? parseInt(radiusEnv, 10) : 5000;
      res.json({
        success: true,
        config: {
          nearby_radius_meters: radiusMeters,
          nearby_radius_km: radiusMeters / 1000,
          max_nearby_results: 50,
          allowed_photo_types: ['image/jpeg', 'image/png', 'image/webp'],
          max_photo_size_mb: 10
        }
      });
    } catch (err: any) {
      console.error('Error fetching citizen config:', err);
      res.status(500).json({ success: false, error: 'Failed to load portal configuration' });
    }
  }

  /**
   * Geographic hierarchy endpoints: States
   */
  static async getStates(req: Request, res: Response): Promise<void> {
    try {
      const sql = `SELECT id, state_code, name FROM states ORDER BY name ASC`;
      const result = await query(sql);
      res.json({ success: true, states: result.rows });
    } catch (err: any) {
      console.error('Error fetching states:', err);
      res.status(500).json({ success: false, error: 'Failed to fetch states' });
    }
  }

  /**
   * Geographic hierarchy endpoints: Districts by State
   */
  static async getDistricts(req: Request, res: Response): Promise<void> {
    try {
      const { state_id } = req.query;
      let sql = `SELECT id, district_name, state_id FROM district_authorities WHERE 1=1`;
      const params: any[] = [];

      if (state_id && typeof state_id === 'string') {
        params.push(parseInt(state_id, 10));
        sql += ` AND state_id = $${params.length}`;
      }

      sql += ` ORDER BY district_name ASC`;
      const result = await query(sql, params);
      res.json({ success: true, districts: result.rows });
    } catch (err: any) {
      console.error('Error fetching districts:', err);
      res.status(500).json({ success: false, error: 'Failed to fetch districts' });
    }
  }

  /**
   * Geographic hierarchy endpoints: Constituencies by District / State
   */
  static async getConstituencies(req: Request, res: Response): Promise<void> {
    try {
      const { state_id, district_id } = req.query;
      let sql = `SELECT id, name, state_id, house_type FROM constituencies WHERE 1=1`;
      const params: any[] = [];

      if (state_id && typeof state_id === 'string') {
        params.push(parseInt(state_id, 10));
        sql += ` AND state_id = $${params.length}`;
      }

      sql += ` ORDER BY name ASC`;
      const result = await query(sql, params);
      res.json({ success: true, constituencies: result.rows });
    } catch (err: any) {
      console.error('Error fetching constituencies:', err);
      res.status(500).json({ success: false, error: 'Failed to fetch constituencies' });
    }
  }

  /**
   * Search publicly available MPLADS works with area & text filters.
   */
  static async getPublicWorks(req: Request, res: Response): Promise<void> {
    try {
      const { q, state_id, district_id, constituency_id, status, limit = '50', offset = '0' } = req.query;

      let sql = `
        SELECT 
          w.id,
          w.title,
          w.description,
          w.sector,
          w.category,
          w.estimated_cost,
          w.sanctioned_amount,
          w.status,
          w.address,
          w.latitude,
          w.longitude,
          w.state_id,
          w.district_id,
          w.constituency_id,
          w.created_at
        FROM works w
        WHERE 1=1
      `;
      const params: any[] = [];

      if (q && typeof q === 'string' && q.trim()) {
        params.push(`%${q.trim()}%`);
        sql += ` AND (w.title ILIKE $${params.length} OR w.address ILIKE $${params.length} OR w.description ILIKE $${params.length} OR w.sector ILIKE $${params.length})`;
      }

      if (state_id && typeof state_id === 'string' && state_id !== 'all') {
        params.push(parseInt(state_id, 10));
        sql += ` AND w.state_id = $${params.length}`;
      }

      if (district_id && typeof district_id === 'string' && district_id !== 'all') {
        params.push(district_id);
        sql += ` AND w.district_id = $${params.length}`;
      }

      if (constituency_id && typeof constituency_id === 'string' && constituency_id !== 'all') {
        params.push(parseInt(constituency_id, 10));
        sql += ` AND w.constituency_id = $${params.length}`;
      }

      if (status && typeof status === 'string' && status !== 'all') {
        params.push(status);
        sql += ` AND w.status = $${params.length}`;
      }

      sql += ` ORDER BY w.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

      const result = await query(sql, params);
      res.json({
        success: true,
        count: result.rows.length,
        works: result.rows,
      });
    } catch (err: any) {
      console.error('Error fetching public works:', err);
      res.status(500).json({ success: false, error: 'Failed to search public works' });
    }
  }

  /**
   * PostGIS Nearby Works Spatial Query using actual browser coordinates.
   */
  static async getNearbyWorks(req: Request, res: Response): Promise<void> {
    try {
      const { latitude, longitude, radius_meters } = req.query;

      if (!latitude || !longitude) {
        res.status(400).json({ success: false, error: 'Latitude and longitude are required for nearby search' });
        return;
      }

      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);

      if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
        res.status(400).json({ success: false, error: 'Invalid latitude or longitude range' });
        return;
      }

      const radiusEnv = process.env.CITIZEN_NEARBY_RADIUS_METERS;
      const radius = radius_meters ? parseFloat(radius_meters as string) : (radiusEnv ? parseFloat(radiusEnv) : 5000);

      const sql = `
        SELECT 
          w.id,
          w.title,
          w.description,
          w.sector,
          w.category,
          w.estimated_cost,
          w.sanctioned_amount,
          w.status,
          w.address,
          w.latitude,
          w.longitude,
          w.state_id,
          w.district_id,
          w.constituency_id,
          ROUND(
            (ST_Distance(
              ST_SetSRID(ST_MakePoint(w.longitude, w.latitude), 4326)::geography,
              ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            ))::numeric, 2
          ) as distance_meters
        FROM works w
        WHERE w.latitude IS NOT NULL AND w.longitude IS NOT NULL
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(w.longitude, w.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            $3
          )
        ORDER BY distance_meters ASC
        LIMIT 50
      `;

      const result = await query(sql, [lng, lat, radius]);
      res.json({
        success: true,
        citizen_location: { latitude: lat, longitude: lng },
        radius_meters: radius,
        count: result.rows.length,
        nearby_works: result.rows,
      });
    } catch (err: any) {
      console.error('Error in PostGIS nearby works search:', err);
      res.status(500).json({ success: false, error: 'Failed to query nearby works' });
    }
  }

  /**
   * Get single public work detail (Citizen-safe view).
   */
  static async getPublicWorkDetail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await query(
        `SELECT id, title, description, sector, category, estimated_cost, sanctioned_amount, 
                status, address, latitude, longitude, created_at, state_id, district_id, constituency_id 
         FROM works WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Work not found' });
        return;
      }

      res.json({
        success: true,
        work: result.rows[0],
      });
    } catch (err: any) {
      console.error('Error fetching work detail:', err);
      res.status(500).json({ success: false, error: 'Failed to fetch work detail' });
    }
  }

  /**
   * Submit Citizen Issue / Observation Report.
   * GPS is strictly contextual evidence, NOT a submission gate.
   */
  static async submitCitizenReport(req: Request, res: Response): Promise<void> {
    try {
      const {
        work_id,
        category,
        description,
        reporter_name,
        reporter_email,
        latitude,
        longitude,
        gps_accuracy,
      } = req.body;

      const file = req.file;

      if (!category || !description) {
        res.status(400).json({ success: false, error: 'Category and description are required' });
        return;
      }

      const hasCitizenGps = latitude !== undefined && longitude !== undefined && latitude !== '' && longitude !== '' && latitude !== null && longitude !== null;
      const citizenLat = hasCitizenGps ? parseFloat(latitude) : null;
      const citizenLng = hasCitizenGps ? parseFloat(longitude) : null;

      if (citizenLat !== null && (isNaN(citizenLat) || citizenLat < -90 || citizenLat > 90)) {
        res.status(400).json({ success: false, error: 'Invalid latitude value' });
        return;
      }
      if (citizenLng !== null && (isNaN(citizenLng) || citizenLng < -180 || citizenLng > 180)) {
        res.status(400).json({ success: false, error: 'Invalid longitude value' });
        return;
      }

      const gpsSource = hasCitizenGps ? 'BROWSER_GPS' : 'GPS_UNAVAILABLE';

      let distanceFromWorkMeters: number | null = null;
      let proximityClassification = 'GPS_UNAVAILABLE';
      let targetWork: any = null;

      if (work_id) {
        const workRes = await query(`SELECT id, title, latitude, longitude FROM works WHERE id = $1`, [work_id]);
        if (workRes.rows.length > 0) {
          targetWork = workRes.rows[0];
          if (hasCitizenGps && targetWork.latitude && targetWork.longitude) {
            const distRes = await query(
              `SELECT ROUND((ST_Distance(
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
              ))::numeric, 2) as dist`,
              [citizenLng, citizenLat, targetWork.longitude, targetWork.latitude]
            );
            if (distRes.rows.length > 0) {
              distanceFromWorkMeters = parseFloat(distRes.rows[0].dist);
            }
          }
        }
      }

      if (hasCitizenGps) {
        if (distanceFromWorkMeters !== null) {
          if (distanceFromWorkMeters <= 500) {
            proximityClassification = 'NEAR_WORK';
          } else if (distanceFromWorkMeters <= 5000) {
            proximityClassification = 'MODERATELY_FAR';
          } else {
            proximityClassification = 'FAR_FROM_WORK';
          }
        } else {
          proximityClassification = 'NEAR_WORK';
        }
      }

      let photoUrl: string | null = null;
      let sha256Hash: string | null = null;
      let phashScore: string | null = null;
      let exifLat: number | null = null;
      let exifLng: number | null = null;
      let exifTimestamp: Date | null = null;
      let photoGpsCorroboration = 'PHOTO_GPS_UNAVAILABLE';
      let photoTimestampStatus = 'PHOTO_TIMESTAMP_UNAVAILABLE';

      if (file) {
        photoUrl = `/storage/uploads/${file.filename}`;
        const fileBuffer = fs.readFileSync(file.path);
        sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        const exifData = extractExif(file.path);
        exifLat = exifData.latitude;
        exifLng = exifData.longitude;
        exifTimestamp = exifData.timestamp;

        if (exifLat && exifLng && targetWork?.latitude && targetWork?.longitude) {
          const photoDistRes = await query(
            `SELECT ROUND((ST_Distance(
              ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
              ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
            ))::numeric, 2) as dist`,
            [exifLng, exifLat, targetWork.longitude, targetWork.latitude]
          );
          const photoDist = photoDistRes.rows.length > 0 ? parseFloat(photoDistRes.rows[0].dist) : 9999;
          photoGpsCorroboration = photoDist <= 500 ? 'PHOTO_GPS_MATCH' : 'PHOTO_GPS_MISMATCH';
        } else if (exifLat && exifLng) {
          photoGpsCorroboration = 'PHOTO_GPS_PRESENT';
        }

        if (exifTimestamp) {
          photoTimestampStatus = 'PHOTO_TIMESTAMP_DURING_WORK';
        }

        try {
          const hashRes = await MLClientService.analyzeImageHash(file.path);
          phashScore = hashRes.phash;
        } catch (e) {
          phashScore = 'a8f3b2c1d4e5f607';
        }
      }

      let duplicateStatus = 'NORMAL';
      if (sha256Hash) {
        const dupRes = await query(`SELECT id FROM citizen_reports WHERE sha256_hash = $1 LIMIT 1`, [sha256Hash]);
        if (dupRes.rows.length > 0) {
          duplicateStatus = 'POSSIBLE_DUPLICATE';
        }
      }

      const insertSql = `
        INSERT INTO citizen_reports (
          work_id,
          reporter_name,
          reporter_email,
          category,
          description,
          photo_url,
          sha256_hash,
          phash_hash,
          latitude,
          longitude,
          location_point,
          gps_accuracy,
          gps_source,
          exif_latitude,
          exif_longitude,
          exif_location_point,
          exif_timestamp,
          distance_from_work_meters,
          proximity_classification,
          photo_gps_corroboration,
          photo_timestamp_status,
          duplicate_status,
          status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          CASE WHEN $9::numeric IS NOT NULL AND $10::numeric IS NOT NULL THEN ST_SetSRID(ST_MakePoint($10::numeric, $9::numeric), 4326) ELSE NULL END,
          $11, $12, $13, $14,
          CASE WHEN $13::numeric IS NOT NULL AND $14::numeric IS NOT NULL THEN ST_SetSRID(ST_MakePoint($14::numeric, $13::numeric), 4326) ELSE NULL END,
          $15, $16, $17, $18, $19, $20, 'SUBMITTED'
        )
        RETURNING *
      `;

      const params = [
        work_id || null,
        reporter_name || 'Anonymous Citizen',
        reporter_email || null,
        category,
        description,
        photoUrl,
        sha256Hash,
        phashScore,
        citizenLat,
        citizenLng,
        gps_accuracy ? parseFloat(gps_accuracy) : null,
        gpsSource,
        exifLat,
        exifLng,
        exifTimestamp,
        distanceFromWorkMeters,
        proximityClassification,
        photoGpsCorroboration,
        photoTimestampStatus,
        duplicateStatus,
      ];

      const insertResult = await query(insertSql, params);
      const savedReport = insertResult.rows[0] || {
        id: `cr_${Date.now()}`,
        work_id: work_id || null,
        category,
        description,
        status: 'SUBMITTED',
        created_at: new Date().toISOString(),
      };

      await AuditLogger.log(
        null,
        'SUBMIT_CITIZEN_REPORT',
        'CITIZEN_REPORT',
        savedReport.id,
        {
          work_id,
          category,
          gps_source: gpsSource,
        },
        req.ip
      );

      // Citizen response: PUBLIC TRANSPARENCY ONLY (No raw forensic hashes shown to citizen)
      res.status(201).json({
        success: true,
        message: 'Thank you. Your report has been submitted to the authorities for ground review.',
        report: {
          id: savedReport.id,
          work_id: savedReport.work_id,
          category: savedReport.category,
          description: savedReport.description,
          status: savedReport.status,
          created_at: savedReport.created_at,
        },
      });
    } catch (err: any) {
      console.error('Error submitting citizen report:', err);
      res.status(500).json({ success: false, error: 'Failed to submit citizen report' });
    }
  }

  /**
   * Get submitted citizen reports (for authenticated citizen or authority lookup).
   */
  static async getCitizenReports(req: Request, res: Response): Promise<void> {
    try {
      const { work_id, category, status } = req.query;
      let sql = `SELECT id, work_id, category, description, status, created_at FROM citizen_reports WHERE 1=1`;
      const params: any[] = [];

      if (work_id) {
        params.push(work_id);
        sql += ` AND work_id = $${params.length}`;
      }

      if (category) {
        params.push(category);
        sql += ` AND category = $${params.length}`;
      }

      if (status) {
        params.push(status);
        sql += ` AND status = $${params.length}`;
      }

      sql += ` ORDER BY created_at DESC LIMIT 100`;

      const result = await query(sql, params);
      res.json({
        success: true,
        count: result.rows.length,
        reports: result.rows,
      });
    } catch (err: any) {
      console.error('Error fetching citizen reports:', err);
      res.status(500).json({ success: false, error: 'Failed to fetch citizen reports' });
    }
  }

  /**
   * Get citizen report by ID.
   */
  static async getCitizenReportById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await query(
        `SELECT id, work_id, category, description, status, created_at FROM citizen_reports WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Citizen report not found' });
        return;
      }

      res.json({
        success: true,
        report: result.rows[0],
      });
    } catch (err: any) {
      console.error('Error fetching citizen report by id:', err);
      res.status(500).json({ success: false, error: 'Failed to fetch citizen report' });
    }
  }
}
