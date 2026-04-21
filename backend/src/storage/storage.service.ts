import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(StorageService.name);

  constructor(private config: ConfigService) {
    this.supabase = createClient(
      this.config.getOrThrow('SUPABASE_URL'),
      this.config.getOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  /**
   * Upload a single file to Supabase Storage
   * @param bucket  - bucket name (e.g. 'products', 'avatars')
   * @param file    - Multer file
   * @param folder  - optional sub-folder inside bucket
   * @returns       public URL of the uploaded file
   */
  async upload(
    bucket: string,
    file: Express.Multer.File,
    folder = '',
  ): Promise<string> {
    const ext = path.extname(file.originalname);
    const fileName = `${folder ? folder + '/' : ''}${randomUUID()}${ext}`;

    const { error } = await this.supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error(`Upload failed: ${error.message}`);
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  /**
   * Upload multiple files at once
   */
  async uploadMany(
    bucket: string,
    files: Express.Multer.File[],
    folder = '',
  ): Promise<string[]> {
    return Promise.all(files.map((f) => this.upload(bucket, f, folder)));
  }

  /**
   * Delete a file from Supabase Storage by its public URL
   */
  async delete(bucket: string, publicUrl: string): Promise<void> {
    const baseUrl = `${this.config.getOrThrow('SUPABASE_URL')}/storage/v1/object/public/${bucket}/`;
    const filePath = publicUrl.replace(baseUrl, '');

    if (!filePath) return;

    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      this.logger.warn(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMany(bucket: string, publicUrls: string[]): Promise<void> {
    await Promise.all(publicUrls.map((url) => this.delete(bucket, url)));
  }
}
