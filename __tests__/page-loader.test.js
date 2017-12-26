import nock from 'nock';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { fs as fsMz } from 'mz';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import pageLoader from '../src';

const fixturesPath = '__tests__/__fixtures__/';
const host = 'https://hexlet.io/courses';
axios.defaults.adapter = httpAdapter;

test('Download a web page to the file', async () => {
  const fileName = 'hexlet-io-courses.html';
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'load-'));
  const result = await fsMz.readFile(path.join(fixturesPath, fileName), 'utf8');
  nock('https://hexlet.io')
    .get('/courses')
    .reply(200, result);
  await pageLoader(folder, host);
  const expectResult = await fsMz.readFile(path.join(folder, fileName), 'utf8');
  expect(expectResult).toBe(result);
});
