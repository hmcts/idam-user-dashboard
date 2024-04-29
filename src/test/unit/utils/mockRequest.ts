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
  req.header = jest.fn().mockReturnValue(undefined);
  return req;
};
