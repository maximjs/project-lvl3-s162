import { fs } from 'mz';
import axios from 'axios';
import url from 'url';
import path from 'path';

const getFileName = (httpAddr) => {
  const urladdress = url.parse(httpAddr);
  const pathArr = urladdress.pathname === '/' ? [] : urladdress.pathname.split('/').slice(1);
  const hostArr = urladdress.hostname.split('.');
  const nameArr = [...hostArr, ...pathArr];
  const fileName = `${nameArr.join('-')}.html`;
  return fileName;
};

const pageLoader = (dir, httpAddr) => {
  const fileName = getFileName(httpAddr);
  const pathToFile = path.resolve(path.normalize(dir), fileName);
  return axios.get(httpAddr).then(res =>
    fs.writeFile(pathToFile, res.data, 'utf8'));
};

export default pageLoader;
