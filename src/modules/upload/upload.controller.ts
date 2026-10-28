import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../../common/dto/api-response.dto';

const MAX_UPLOAD_BYTES = 80 * 1024 * 1024;
const VIDEO_MIME = new Set([
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-m4v',
]);

@ApiTags('Multimedia - Subida de Archivos')
@ApiBearerAuth()
@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @Post()
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Subir una imagen o un video a Cloudinary' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    async uploadFile(@UploadedFile() file: any) {
        if (!file) {
            throw new BadRequestException('Archivo no encontrado');
        }

        const isImage = typeof file.mimetype === 'string' && file.mimetype.startsWith('image/');
        const extension = String(file.originalname || '').toLowerCase();
        const isVideo =
            VIDEO_MIME.has(file.mimetype) ||
            /\.(mp4|webm|ogg|mov|m4v)$/.test(extension);

        if (!isImage && !isVideo) {
            throw new BadRequestException('El archivo debe ser una imagen o un video (MP4, WebM, MOV u OGG)');
        }

        if (isVideo && file.size > MAX_UPLOAD_BYTES) {
            throw new BadRequestException('El video supera el máximo de 80 MB');
        }

        const result = await this.uploadService.uploadImage(file);
        return ApiResponse.success(
            result,
            isVideo ? 'Video subido correctamente' : 'Imagen subida correctamente',
        );
    }
}
