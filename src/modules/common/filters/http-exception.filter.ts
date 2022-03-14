import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();
    const res = exception.getResponse();
    if (typeof res === 'object') {
      return response.status(status).send(res);
    } else {
      return response.status(status).send({
        statusCode: status,
        message: res,
      });
    }
  }
}
