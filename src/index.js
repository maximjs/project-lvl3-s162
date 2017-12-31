import fs from 'fs';
import { fs as fsMz } from 'mz';
import axios from 'axios';
import url from 'url';
import path from 'path';
import cheerio from 'cheerio';
import debug from 'debug';
import Multispinner from 'multispinner';
import figures from 'figures';

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

const options = {
  indent: 2,
  interval: 250,
  frames: ['-', '\\', '|', '/'],
  autoStart: true,
  clear: true,
  preText: 'Downoading',
  color: {
    incomplete: 'cyan',
    success: 'green',
    error: 'red',
  },
  symbol: {
    success: figures.tick,
    error: figures.cross,
  },
};

const getArrLinks = arr => arr.reduce((acc, el) => [...acc, el.source], []);

const download = (sourceData, spinnerID, spinners) => {
  const sourceUrl = sourceData.source;
  return axios({
    method: 'get',
    url: sourceUrl,
    headers: { 'Accept-Encoding': 'gzip' },
    responseType: 'stream',
  })
    .then((response) => {
      spinners.success(spinnerID);
      log(`http request: ${sourceUrl} and response status: ${response.status}`);
      return { ...sourceData, data: response.data };
    })
    .catch((error) => {
      spinners.error(spinnerID);
      const newError = { ...error, message: `${sourceUrl} ${error.message}` };
      throw newError;
    });
};

const getSourceData = (filesNameAddr) => {
  const linksArr = getArrLinks(filesNameAddr.data);
  const spinners = new Multispinner(linksArr, options);
  return Promise.all(filesNameAddr.data.reduce((acc, sourceData) => {
    const urlAddr = sourceData.source;
    acc.push(download(sourceData, urlAddr, spinners));
    return acc;
  }, []))
    .then((results) => {
      spinners.on('done', () => results);
      return results;
    })
    .catch((err) => {
      throw err;
    });
};

// On promises
const pageLoader = (dir, httpAddr) => {
  log(`current folder: ${dir} and httpAddress: ${httpAddr}`);
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
    }, (error) => {
      const newError = { ...error, message: `${httpAddr} ${error.message}` };
      throw newError;
    })
    .then($ => fsMz.writeFile(pathToFile, $.html(), 'utf8'), (error) => {
      throw error;
    })
    .then(() => {
      if (filesNameAddr.data.length === 0) {
        return Promise.reject(new Error('There is no resources to save'));
      }
      const { newDirName } = filesNameAddr;
      return fsMz.mkdir(path.resolve(path.normalize(dir), newDirName));
    }, (error) => {
      throw error;
    })
    .then(() => getSourceData(filesNameAddr), (error) => {
      throw error;
    })
    .then((dataResponseArr) => {
      dataResponseArr.forEach((el) => {
        const { newDirName } = filesNameAddr;
        const { newFileName, data } = el;
        data.pipe(fs.createWriteStream(path.resolve(path
          .normalize(dir), path.join(newDirName, newFileName))));
      });
    }, (error) => {
      throw error;
    });
};

export default pageLoader;
