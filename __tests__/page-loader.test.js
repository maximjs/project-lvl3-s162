import nock from 'nock';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { fs as fsMz } from 'mz';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import pageLoader from '../src';

const fixturesPath = '__tests__/__fixtures__/';
const host = 'http://www.moogle.com';
axios.defaults.adapter = httpAdapter;

test('Download a web page to the file with sources', async () => {
  const fileHtml = 'test1/test1.html';
  const nockHtml = await fsMz.readFile(path.join(fixturesPath, fileHtml), 'utf8');
  const nockCss = await fsMz.readFile(path.join(fixturesPath, 'test1/test1.css'), 'utf8');
  const nockJs = await fsMz.readFile(path.join(fixturesPath, 'test1/test1.jss'), 'utf8');
  const nockJpg = await fsMz.readFile(path.join(fixturesPath, 'test1/test1.jpg'), 'utf8');
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'load-'));
  const result = await fsMz.readFile(path.join(fixturesPath, 'test1/test1result.html'), 'utf8');
  nock(host).get('/').reply(200, nockHtml);
  nock(host).get('/assets/test1.css').reply(200, nockCss);
  nock(host).get('/assets/test1.jss').reply(200, nockJs);
  nock(host).get('/attachments/test1.jpg').reply(200, nockJpg);
  await pageLoader(folder, host);
  const expectResult = await fsMz.readFile(path.join(folder, 'www-moogle-com.html'), 'utf8');
  console.log(folder);
  expect(expectResult).toBe(result);
});
