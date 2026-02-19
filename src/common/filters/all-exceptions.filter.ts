import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ApiResponse } from '../dto/api-response.dto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

    catch(exception: any, host: ArgumentsHost): void {
        const { httpAdapter } = this.httpAdapterHost;
        const ctx = host.switchToHttp();

        const httpStatus =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.message
                : 'Internal server error';

        const errorResponse = ApiResponse.error(
            exception.name || 'Error',
            message
        );

        // Si es un error de validación (BadRequestException de Nest), extraemos los mensajes
        if (httpStatus === HttpStatus.BAD_REQUEST && exception.response) {
            errorResponse.message = Array.isArray(exception.response.message)
                ? exception.response.message.join(', ')
                : exception.response.message || message;
        }

        // Agregamos el timestamp y el path para depuración (opcional)
        (errorResponse as any).path = httpAdapter.getRequestUrl(ctx.getRequest());
        (errorResponse as any).statusCode = httpStatus;

        httpAdapter.reply(ctx.getResponse(), errorResponse, httpStatus);
    }
}
