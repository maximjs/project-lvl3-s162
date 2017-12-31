#!/usr/bin/env node
import program from 'commander';
import pageLoader from '..';

let httpAddrValue;
program
  .version('0.1.0')
  .usage('[options] <Output directory> <http address to save>')
  .description('Downloads web page')
  .option('-o, --output [dir]', 'Output directory', './')
  .action((httpAddr) => {
    httpAddrValue = httpAddr;
    // console.log('----');
    pageLoader(program.output, httpAddr)
      .catch((error) => {
        console.error(error.message);
        process.exit(1);
      });
  });

program.parse(process.argv);

if (!httpAddrValue) {
  console.error('No arguments, please enter http address');
  process.exit(1);
}
