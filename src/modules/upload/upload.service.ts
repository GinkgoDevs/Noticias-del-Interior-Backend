import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
    constructor(private configService: ConfigService) {
        cloudinary.config({
            cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
        });
    }

    async uploadImage(file: any): Promise<{ url: string; publicId: string }> {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'noticias',
                    resource_type: 'auto',
                },
                (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        return reject(new BadRequestException('Error uploading to Cloudinary'));
                    }
                    if (!result) {
                        return reject(new BadRequestException('Upload result is undefined'));
                    }
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                    });
                },
            );

            uploadStream.end(file.buffer);
        });
    }
}
