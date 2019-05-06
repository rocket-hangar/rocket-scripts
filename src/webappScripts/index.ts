import { say } from 'cfonts';
import multiplerun from 'multiplerun';
import path from 'path';
import { createWebappConfig } from '../configuration/createWebappConfig';
import { parseWebappArgv } from '../configuration/parseWebappArgv';
import { WebappArgv, WebappConfig } from '../types';
import { rimraf } from '../utils/rimraf-promise';
import { sayTitle } from '../utils/sayTitle';
import { buildBrowser } from './buildBrowser';
import { buildServer } from './buildServer';
import { startBrowser } from './startBrowser';
import { startServer } from './startServer';
import { watchServer } from './watchServer';
import help from './help';

const zeroconfigPath: string = path.join(__dirname, '../..');

export async function webappScripts(nodeArgv: string[], {cwd = process.cwd()}: {cwd?: string} = {}) {
  console.log('index.ts..webappScripts()', nodeArgv);
  if (nodeArgv.indexOf('--help') > -1) {
    console.log(help);
    return;
  }
  
  const argv: WebappArgv = parseWebappArgv(nodeArgv);
  const config: WebappConfig = await createWebappConfig({argv, cwd, zeroconfigPath});
  
  if (config.command === 'start' && config.extend.serverSideRendering) {
    const argvString: string = nodeArgv.slice(1).join(' ');
    multiplerun([
      [
        `npx zeroconfig-webapp-scripts server-watch ${argvString} --output ${config.output}`,
        `npx zeroconfig-webapp-scripts server-start ${argvString} --output ${config.output}`,
      ],
      `npx zeroconfig-webapp-scripts browser-start ${argvString} --output ${config.output}`,
    ], cwd);
  } else {
    say('ZEROCONFIG', {font: 'block'});
    
    sayTitle('EXECUTED COMMAND');
    console.log('zeroconfig-webapp-scripts ' + nodeArgv.join(' '));
    
    sayTitle('CREATED CONFIG');
    console.log(config);
    
    switch (config.command) {
      case 'build':
        await rimraf(config.output);
        await buildBrowser(config);
        if (config.extend.serverSideRendering) await buildServer(config);
        break;
      case 'server-watch':
        await watchServer(config);
        break;
      case 'server-start':
        await startServer(config);
        break;
      case 'start':
      case 'browser-start':
        await startBrowser(config);
        break;
      default:
        console.error('Unknown command :', config.command);
    }
  }
}