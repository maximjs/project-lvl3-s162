import fs from 'fs';
import { fs as fsMz } from 'mz';
import axios from 'axios';
import url from 'url';
import path from 'path';
import cheerio from 'cheerio';
import debug from 'debug';

const log = debug('page-loader:');

const getpathArr = (urlAddress) => {
  const { pathname } = urlAddress;
  return pathname === '/' ? [] : pathname.split('/').slice(1);
};

const getUrlObj = urlAddr => url.parse(urlAddr);

const getNamesArr = (httpAddr) => {
  const pathArr = getpathArr(getUrlObj(httpAddr));
  const hostArr = getUrlObj(httpAddr).hostname.split('.');
  return [...hostArr, ...pathArr];
};

const getFileName = (httpAddr) => {
  const namesArr = getNamesArr(httpAddr);
  const fileName = `${namesArr.join('-')}.html`;
  log(`html file name: ${fileName}`);
  return fileName;
};

const getTagDirFileName = (httpAddr, src) => {
  const namesArr = getNamesArr(httpAddr);
  const dirName = `${namesArr.join('-')}_files`;
  const fileNameArr = getpathArr(getUrlObj(src));
  const fileName = `${fileNameArr.join('-')}`;
  log(`source dir: ${dirName} and name: ${fileName}`);
  return [dirName, fileName];
};

const sourceTypes = {
  img: 'src',
  script: 'src',
  link: 'href',
};

const listrFiles = (ctx, data) => {
  if (!ctx) {
    return null;
  }
  ctx.links = data;
  return ctx.links;
};

const listrPage = (ctx, data) => {
  if (!ctx) {
    return null;
  }
  ctx.page = data;
  return ctx.page;
};

const getArrLinks = arr => arr.reduce((acc, el) => [...acc, el.source], []);

const getSourceData = (filesNameAddr, ctx) => {
  const linksArr = getArrLinks(filesNameAddr.data);
  listrFiles(ctx, linksArr);
  const { data } = filesNameAddr;
  const dataPromiseArr = data.map((el) => {
    const sourceUrl = el.source;
    return axios({
      method: 'get',
      url: sourceUrl,
      headers: { 'Accept-Encoding': 'gzip' },
      responseType: 'stream',
    })
      .then((response) => {
        log(`http request: ${sourceUrl} and response status: ${response.status}`);
        return { ...el, data: response.data };
      }, (error) => {
        const newError = { ...error, message: `${sourceUrl} ${error.message}` };
        throw newError;
      });
  });
  return Promise.all(dataPromiseArr);
};

// On promises
const pageLoader = (dir, httpAddr, ctx) => {
  log(`current folder: ${dir} and httpAddress: ${httpAddr}`);
  const fileName = getFileName(httpAddr);
  const pathToFile = path.resolve(path.normalize(dir), fileName);
  const filesNameAddr = { data: [] };
  return axios.get(httpAddr)
    .then((res) => {
      listrPage(ctx, httpAddr);
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
    }, (error) => {
      const newError = { ...error, message: `${httpAddr} ${error.message}` };
      throw newError;
    })
    .then($ => fsMz.writeFile(pathToFile, $.html(), 'utf8'))
    .then(() => {
      if (filesNameAddr.data.length === 0) {
        return Promise.reject(new Error('There is no resources to save'));
      }
      const { newDirName } = filesNameAddr;
      return fsMz.mkdir(path.resolve(path.normalize(dir), newDirName));
    })
    .then(() => getSourceData(filesNameAddr, ctx))
    .then((dataResponseArr) => {
      dataResponseArr.forEach((el) => {
        const { newDirName } = filesNameAddr;
        const { newFileName, data } = el;
        data.pipe(fs.createWriteStream(path.resolve(path
          .normalize(dir), path.join(newDirName, newFileName))));
      });
    });
};

export default pageLoader;
