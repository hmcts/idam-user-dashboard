export const isObjectEmpty = (obj: {}): boolean => {
  return Object.keys(obj).length === 0;
};

export function validateUrlFormat(url: string): boolean {
  const regexp = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '(([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}'+ // domain name and extension
    '(:\\d+)?'+ // port
    '(\\/[-a-z\\d%@_.~+&:]*)*'+ // path
    '(\\?[;&a-z\\d%@_.,~+&:=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator

  return regexp.test(url);
}
