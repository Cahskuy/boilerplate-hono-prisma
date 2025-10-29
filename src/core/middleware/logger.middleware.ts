import pino from 'pino';

const logger = pino();

export const loggerMiddleware = () => async (c: any, next: any) => {
    logger.info({ url: c.req.url, method: c.req.method });
    await next();
};
export { logger };
