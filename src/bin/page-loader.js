#!/usr/bin/env node
import program from 'commander';
import pageLoader from '..';

program
  .version('0.0.1')
  .usage('[options] <Output directory> <http address to save>')
  .description('Downloads web page')
  .option('-o, --output [dir]', 'Output directory', './')
  .action((httpAddr) => {
    pageLoader(program.output, httpAddr);
  });
program.parse(process.argv);
