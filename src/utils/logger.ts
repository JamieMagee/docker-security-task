import * as tl from 'azure-pipelines-task-lib';
import chalk from 'chalk';
import stripAnsi from 'strip-ansi';

function write(prefix: string, ...args: unknown[]): void {
  console.log([`[${prefix}]`, ...args].join(' '));
}

function debug(msg: unknown, ...args: unknown[]): void {
  write(chalk.blue('DEBUG'), msg, ...args);
}

function info(msg: unknown, ...args: unknown[]): void {
  write(chalk.green('INFO'), msg, ...args);
}

function warn(msg: unknown, ...args: unknown[]): void {
  write(chalk.magenta('WARN'), msg, ...args);
  tl.logIssue(tl.IssueType.Warning, stripAnsi([msg, ...args].join(' ')));
}

function error(msg: unknown, ...args: unknown[]): void {
  write(chalk.red('ERROR'), msg, ...args);
  tl.logIssue(tl.IssueType.Error, stripAnsi([msg, ...args].join(' ')));
}

const log = (): void => {};

log.debug = (m: unknown, ...args: unknown[]): void => info(m, ...args);
log.info = (m: unknown, ...args: unknown[]): void => info(m, ...args);
log.warn = (m: unknown, ...args: unknown[]): void => warn(m, ...args);
log.error = (m: unknown, ...args: unknown[]): void => error(m, ...args);

export default log;
