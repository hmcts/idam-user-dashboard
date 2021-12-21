export const mockRequest = () => {
  const req: any = {
    body: '',
    scope: {
      cradle: {
      }
    },
    query: {}
  };
  req.body = jest.fn().mockReturnValue(req);
  return req;
};
