export const mockResponse = () => {
  const res: any = {};
  res.redirect = jest.fn().mockReturnValue(res);
  res.render = jest.fn().mockReturnValue(res);
  res.header = jest.fn();
  res.attachment = jest.fn();
  res.send = jest.fn();
  return res;
};
