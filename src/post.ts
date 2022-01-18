import exec from '@actions/exec';
import github from '@actions/github';
import glob from '@actions/glob';
import { Storage } from '@google-cloud/storage';
import path from 'path';
import { withFile as withTemporaryFile } from 'tmp-promise';

import { getInputs } from './inputs';
import { getState } from './state';

async function main() {
  const inputs = getInputs();
  const state = getState();

  if (state.cacheHitKind === 'exact') {
    console.log(
      '🌀 Skipping uploading cache as the cache was hit by exact match.',
    );
    return;
  }

  const bucket = new Storage().bucket(inputs.bucket);
  const folderPrefix = `${github.context.repo.owner}/${github.context.repo.repo}`;

  const targetFileName = `${folderPrefix}/${inputs.key}.tar.gz`;
  const [targetFileExists] = await bucket.file(targetFileName).exists();

  if (targetFileExists) {
    console.log(
      '🌀 Skipping uploading cache as it already exists (probably due to another job).',
    );
    return;
  }

  const workspace = process.env.GITHUB_WORKSPACE ?? process.cwd();
  const globber = await glob.create(inputs.path, {
    implicitDescendants: false,
  });

  const paths = await globber
    .glob()
    .then((files) => files.map((file) => path.relative(workspace, file)));

  return withTemporaryFile(async (tmpFile) => {
    console.log('🗜️ Creating cache archive...');

    await exec.exec('tar', [
      '--posix',
      '-czf',
      tmpFile.path,
      '-P',
      '-C',
      workspace,
      ...paths,
    ]);

    console.log('🌐 Uploading cache archive to bucket...');
    await bucket.upload(tmpFile.path, {
      destination: targetFileName,
    });
  });
}

void main();