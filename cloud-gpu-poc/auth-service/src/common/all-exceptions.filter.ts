import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

const CODE_MAP: Record<number, string> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  500: 'INTERNAL_ERROR',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception instanceof HttpException ? exception.getResponse() : exception?.message;
    const message = typeof raw === 'string' ? raw : (raw as any)?.message || 'Server error';
    const code = (raw as any)?.code || CODE_MAP[status] || 'INTERNAL_ERROR';
    res.status(status).send({
      error: true,
      message: Array.isArray(message) ? message.join(', ') : message,
      code,
    });
  }
}
