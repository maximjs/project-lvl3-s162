import fs from 'fs';
import { fs as fsMz } from 'mz';
import axios from 'axios';
import url from 'url';
import path from 'path';
import cheerio from 'cheerio';

require('babel-polyfill');

const getFileName = (httpAddr) => {
  const urlAddress = url.parse(httpAddr);
  const pathArr = urlAddress.pathname === '/' ? [] : urlAddress.pathname.split('/').slice(1);
  const hostArr = urlAddress.hostname.split('.');
  const nameArr = [...hostArr, ...pathArr];
  const fileName = `${nameArr.join('-')}.html`;
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
  return [dirName, fileName];
};

const sourceTypes = {
  img: 'src',
  script: 'src',
  link: 'href',
};

// On promises
const pageLoader = (dir, httpAddr) => {
  const fileName = getFileName(httpAddr);
  const pathToFile = path.resolve(path.normalize(dir), fileName);
  const filesNameAddrArr = [];
  return axios.get(httpAddr)
    .then((res) => {
      const $ = cheerio.load(res.data);
      $('script, img, link').each((i, el) => {
        const { tagName } = $(el)[0];
        const source = $(el).attr(sourceTypes[tagName]);
        if (source) {
          const [newDirName, newFileName] = getTagDirFileName(httpAddr, source);
          const newAddr = path.join(newDirName, newFileName);
          filesNameAddrArr.push([newDirName, newFileName, source]);
          $(el).attr(sourceTypes[tagName], newAddr);
        }
      });
      return fsMz.writeFile(pathToFile, $.html(), 'utf8')
        .then(() => {
          if (filesNameAddrArr.length > 0) {
            fsMz.mkdir(path.resolve(path.normalize(dir), filesNameAddrArr[0][0]))
              .then(() =>
                filesNameAddrArr.forEach(el =>
                  axios({
                    method: 'get',
                    url: el[2],
                    headers: { 'Accept-Encoding': 'gzip' },
                    responseType: 'stream',
                  })
                    .then(response =>
                      response.data.pipe(fs.createWriteStream(path.resolve(path
                        .normalize(dir), path.join(el[0], el[1])))))));
          }
        });
    });
};

// On async/await
// const pageLoader = async (dir, httpAddr) => {
//   const fileName = getFileName(httpAddr);
//   const pathToFile = path.resolve(path.normalize(dir), fileName);
//   const filesNameAddrArr = [];
//   const res = await axios.get(httpAddr);
//   const $ = cheerio.load(res.data);
//   $('script, img, link').each((i, el) => {
//     const { tagName } = $(el)[0];
//     const source = $(el).attr(sourceTypes[tagName]);
//     if (source) {
//       const [newDirName, newFileName] = getTagDirFileName(httpAddr, source);
//       const newAddr = path.join(newDirName, newFileName);
//       filesNameAddrArr.push([newDirName, newFileName, source]);
//       $(el).attr(sourceTypes[tagName], newAddr);
//     }
//   });
//   await fsMz.writeFile(pathToFile, $.html(), 'utf8');
//   if (filesNameAddrArr.length > 0) {
//     await fsMz.mkdir(path.resolve(path.normalize(dir), filesNameAddrArr[0][0]));
//     filesNameAddrArr.forEach(async (el) => {
//       const response = await axios({
//         method: 'get',
//         url: el[2],
//         headers: { 'Accept-Encoding': 'gzip' },
//         responseType: 'stream',
//       });
//       response.data.pipe(fs.createWriteStream(path.resolve(path
//         .normalize(dir), path.join(el[0], el[1]))));
//     });
//   }
// };

export default pageLoader;
