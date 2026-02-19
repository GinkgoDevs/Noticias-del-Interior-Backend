import { ApiProperty } from '@nestjs/swagger';

/**
 * Respuesta estándar de la API
 */
export class ApiResponse<T> {
    @ApiProperty()
    success: boolean;

    @ApiProperty({ required: false })
    data?: T;

    @ApiProperty({ required: false })
    message?: string;

    @ApiProperty({ required: false })
    error?: string;

    @ApiProperty()
    timestamp: string;

    constructor(data?: T, message?: string) {
        this.success = true;
        this.data = data;
        this.message = message;
        this.timestamp = new Date().toISOString();
    }

    static success<T>(data: T, message?: string): ApiResponse<T> {
        return new ApiResponse(data, message);
    }

    static error(error: string, message?: string): ApiResponse<null> {
        const response = new ApiResponse<null>();
        response.success = false;
        response.error = error;
        response.message = message;
        return response;
    }
}
