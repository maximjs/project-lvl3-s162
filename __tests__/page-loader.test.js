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
const emptyHtml = '<html><body>empty html</body></html>';

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
  expect(expectResult).toBe(result);
});

test('http error 404', async () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'load-'));
  nock(host).get('/wrongaddr').reply(404);
  try {
    await pageLoader(folder, `${host}/wrongaddr`);
    expect(false).toBe(true);
  } catch (err) {
    expect(err.response.status).toBe(404);
  }
});

test('http error 500', async () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'load-'));
  nock(host).get('/wrongaddr').reply(500);
  try {
    await pageLoader(folder, `${host}/wrongaddr`);
    expect(false).toBe(true);
  } catch (err) {
    expect(err.response.status).toBe(500);
  }
});

test('Can`t download resource from web page, error 403', async () => {
  const fileHtml = 'test1/test1.html';
  const nockHtml = await fsMz.readFile(path.join(fixturesPath, fileHtml), 'utf8');
  const nockCss = await fsMz.readFile(path.join(fixturesPath, 'test1/test1.css'), 'utf8');
  const nockJpg = await fsMz.readFile(path.join(fixturesPath, 'test1/test1.jpg'), 'utf8');
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'load-'));
  nock(host).get('/').reply(200, nockHtml);
  nock(host).get('/assets/test1.css').reply(200, nockCss);
  nock(host).get('/assets/test1.jss').reply(403);
  nock(host).get('/attachments/test1.jpg').reply(200, nockJpg);
  try {
    await pageLoader(folder, host);
    expect(false).toBe(true);
  } catch (err) {
    expect(err.response.status).toBe(403);
  }
});

test('Wrong directory', async () => {
  const fakedir = './fakedir';
  const tmpFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'load-'));
  const pathToFile = path.join(tmpFolder, fakedir, 'www-moogle-com.html');
  nock(host).get('/').reply(200, emptyHtml);
  try {
    await pageLoader(pathToFile, host);
    expect(false).toBe(true);
  } catch (err) {
    expect(err.code).toBe('ENOENT');
  }
});

test('Don`t have access to write file', async () => {
  const tmpFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'load-'));
  nock(host).get('/').reply(200, emptyHtml);
  const pathToFile = path.join(tmpFolder, 'www-moogle-com.html');
  fs.openSync(pathToFile, 'a');
  fs.chmodSync(pathToFile, 0o444);
  try {
    await pageLoader(tmpFolder, host);
    expect(false).toBe(true);
  } catch (err) {
    expect(err.code).toBe('EACCES');
  }
});
