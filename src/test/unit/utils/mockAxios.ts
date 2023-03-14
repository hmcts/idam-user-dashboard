import { AuthorizedAxios } from '../../../main/app/authorized-axios/AuthorizedAxios';

export const mockAxios = (): AuthorizedAxios => {
  const axios: Partial<AuthorizedAxios> = {};

  axios.get = jest.fn();
  axios.post = jest.fn();
  axios.put = jest.fn();
  axios.delete = jest.fn();

  return axios as AuthorizedAxios;
};
