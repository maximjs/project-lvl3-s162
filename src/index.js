import fs from 'fs';
import { fs as fsMz } from 'mz';
import axios from 'axios';
import url from 'url';
import path from 'path';
import cheerio from 'cheerio';
import debug from 'debug';

const log = debug('page-loader:');

const getFileName = (httpAddr) => {
  const urlAddress = url.parse(httpAddr);
  const pathArr = urlAddress.pathname === '/' ? [] : urlAddress.pathname.split('/').slice(1);
  const hostArr = urlAddress.hostname.split('.');
  const nameArr = [...hostArr, ...pathArr];
  const fileName = `${nameArr.join('-')}.html`;
  log(fileName);
  return fileName;
};

const getTagDirFileName = (httpAddr, src) => {
  const urlAddress = url.parse(httpAddr);
  const pathArr = urlAddress.pathname === '/' ? [] : urlAddress.pathname.split('/').slice(1);
  const hostArr = urlAddress.hostname.split('.');
  const nameArr = [...hostArr, ...pathArr];
  const dirName = `${nameArr.join('-')}_files`;
  const pathAddress = url.parse(src);
  const fileNameArr = pathAddress.pathname === '/' ? [] : pathAddress.pathname.split('/').slice(1);
  const fileName = `${fileNameArr.join('-')}`;
  log(dirName, fileName);
  return [dirName, fileName];
};

const sourceTypes = {
  img: 'src',
  script: 'src',
  link: 'href',
};

// On promises
const pageLoader = (dir, httpAddr) => {
  log(dir, httpAddr);
  const fileName = getFileName(httpAddr);
  const pathToFile = path.resolve(path.normalize(dir), fileName);
  const filesNameAddr = { data: [] };
  return axios.get(httpAddr)
    .then((res) => {
      const $ = cheerio.load(res.data);
      $('script, img, link').each((i, el) => {
        const tagName = el.name;
        const source = $(el).attr(sourceTypes[tagName]);
        if (source) {
          const [newDirName, newFileName] = getTagDirFileName(httpAddr, source);
          const newAddr = path.join(newDirName, newFileName);
          filesNameAddr.newDirName = newDirName;
          filesNameAddr.data.push({ newFileName, source });
          $(el).attr(sourceTypes[tagName], newAddr);
        }
      });
      return $;
    }, error => console.error(`Can\`t download page ${httpAddr}:\n`, error))
    .then($ => fsMz.writeFile(pathToFile, $.html(), 'utf8'), error =>
      console.error(`Can\`t write html file ${pathToFile}:\n`, error))
    .then(() => {
      if (filesNameAddr.data.length === 0) {
        return Promise.reject(new Error('There is no resources to save'));
      }
      const { newDirName } = filesNameAddr;
      return fsMz.mkdir(path.resolve(path.normalize(dir), newDirName));
    }, error => console.error('Can`t create folder for source files:\n', error))
    .then(() => {
      filesNameAddr.data.forEach((el) => {
        const sourceUrl = el.source;
        return axios({
          method: 'get',
          url: sourceUrl,
          headers: { 'Accept-Encoding': 'gzip' },
          responseType: 'stream',
        })
          .then((response) => {
            const [{ newDirName }, { newFileName }] = [filesNameAddr, el];
            log(sourceUrl, response.status);
            return response.data.pipe(fs.createWriteStream(path.resolve(path
              .normalize(dir), path.join(newDirName, newFileName))));
          }, error => console.error('Can`t download a source file:\n', error));
      });
    }, error => console.error('Can`t download or write some source files from web page:\n', error));
};

export default pageLoader;
