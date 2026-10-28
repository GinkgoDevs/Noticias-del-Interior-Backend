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

    async uploadImage(file: any): Promise<{ url: string; publicId: string; resourceType: string }> {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const originalName = String(file.originalname || '');
        const isImage = typeof file.mimetype === 'string' && file.mimetype.startsWith('image/');
        const isVideo = !isImage && (
            (typeof file.mimetype === 'string' && file.mimetype.startsWith('video/')) ||
            /\.(mp4|webm|ogg|mov|m4v)$/i.test(originalName)
        );
        const isQuickTime = file.mimetype === 'video/quicktime' || /\.mov$/i.test(originalName);

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'noticias',
                    resource_type: isVideo ? 'video' : 'image',
                    // Los .mov no se reproducen en Chrome. Cloudinary los convierte a MP4.
                    ...(isVideo && isQuickTime ? { format: 'mp4' } : {}),
                },
                (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        return reject(new BadRequestException('No se pudo subir el archivo'));
                    }
                    if (!result) {
                        return reject(new BadRequestException('Upload result is undefined'));
                    }
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                        resourceType: result.resource_type,
                    });
                },
            );

            uploadStream.end(file.buffer);
        });
    }
}
