import * as core from '@actions/core';

export interface Inputs {
  bucket: string;
  path: string;
  bucketPrefix: string;
  key: string;
  restoreKeys: string[];
}

export function getInputs(): Inputs {
  const inputs = {
    bucket: core.getInput('bucket', { required: true }),
    path: core.getInput('path', { required: true }),
    bucketPrefix: core.getInput('bucket-prefix', { required: false }),
    key: core.getInput('key', { required: true }),
    restoreKeys: core
      .getInput('restore-keys')
      .split(',')
      .filter((path) => path),
  };

  core.debug(`Loaded inputs: ${JSON.stringify(inputs)}.`);

  return inputs;
}
