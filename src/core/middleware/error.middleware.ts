export const errorMiddleware = () => async (err: any, c: any) => {
    const status = err.status ?? 500;
    const message = err.expose ? err.message : 'Internal Server Error';
    console.log(err.message);
    return c.json({ error: { field: err.field, message: message } }, status);
};
