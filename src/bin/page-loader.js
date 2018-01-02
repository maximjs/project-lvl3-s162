#!/usr/bin/env node
import program from 'commander';
import Listr from 'listr';
import colors from 'colors'; // eslint-disable-line
import pageLoader from '..';

let httpAddrValue;

const tasks = (httpAddr, dir) => new Listr([
  {
    title: `Saving page ${httpAddr}`.green,
    task: () =>
      new Listr([
        {
          title: 'Downloading'.cyan,
          task: ctx =>
            pageLoader(dir, httpAddr, ctx)
              .then((res) => {
                ctx.res = res;
                return new Listr([
                  {
                    title: 'Loading page'.cyan,
                    task: () => console.log((` ${'✔'.green}  Page ${ctx.page} is successfully loaded\n`)),
                  },
                  {
                    title: 'Loading files'.cyan,
                    task: () => ctx.links.forEach(link =>
                      console.log((` ${'✔'.green}  File ${link} is successfully loaded`))),
                  },
                ]);
              }),
        },

      ]),
  },
]);

program
  .version('0.1.1')
  .usage('[options] <Output directory> <http address to save>')
  .description('Downloads web page')
  .option('-o, --output [dir]', 'Output directory', './')
  .action((httpAddr) => {
    httpAddrValue = httpAddr;
    const dir = program.output;
    return tasks(httpAddr, dir).run()
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
