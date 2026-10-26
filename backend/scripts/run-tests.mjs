import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const requestedArguments = process.argv.slice(2);
const runInBand = requestedArguments.includes('--runInBand');
const forwardedArguments = requestedArguments.filter(
  (argument) => argument !== '--runInBand',
);
const vitestCli = fileURLToPath(
  new URL('../node_modules/vitest/vitest.mjs', import.meta.url),
);
const argumentsForVitest = [
  vitestCli,
  'run',
  '--config',
  './vitest.config.ts',
  ...(runInBand ? ['--no-file-parallelism'] : []),
  ...forwardedArguments,
];
const result = spawnSync(process.execPath, argumentsForVitest, {
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
