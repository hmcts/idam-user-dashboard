export const mockRequest = () => {
  const req: any = {
    body: '',
    query: {}
  };
  req.body = jest.fn().mockReturnValue(req);
  return req;
};
