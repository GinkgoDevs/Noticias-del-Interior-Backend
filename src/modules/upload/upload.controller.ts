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

@ApiTags('Multimedia - Subida de Archivos')
@ApiBearerAuth()
@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Subir una imagen a Cloudinary' })
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

        // Validar tipo de archivo
        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('El archivo debe ser una imagen');
        }

        const result = await this.uploadService.uploadImage(file);
        return ApiResponse.success(result, 'Imagen subida correctamente');
    }
}
