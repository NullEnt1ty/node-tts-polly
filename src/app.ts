#!/usr/bin/env node
'use strict';

import AWS from 'aws-sdk';
import { SynthesizeSpeechInput } from 'aws-sdk/clients/polly';
import { spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import process from 'process';
import { Stream } from 'stream';

const config = {
  voice: 'Vicki',
};

function log(message: string): void {
  process.stderr.write(`${message}\n`);
}

function getFilenameForText(text: string, voice: string, format: string): string {
  const hash = crypto.createHash('sha1');
  hash.update(text);

  return `${voice}_${hash.digest('hex').toString()}.${format}`;
}

function getCacheDirPath(): string {
  return path.join(os.tmpdir(), 'node-tts-polly', 'cache');
}

function ensureCacheDirExists(): void {
  const cacheDirPath = getCacheDirPath();

  if (!fs.existsSync(cacheDirPath)) {
    fs.mkdirSync(cacheDirPath, { recursive: true });
  }
}

function convertMp3ToWav(mp3Buffer: Buffer): Stream {
  const args = ['-f', 'mp3', '-i', '-', '-f', 'wav', '-ac', '1', '-ar', '16k', '-c:a', 'pcm_s16le', '-'];
  const ffmpegProcess = spawn('ffmpeg', args);

  ffmpegProcess.stdin.write(mp3Buffer);
  ffmpegProcess.stdin.end();

  return ffmpegProcess.stdout;
}

async function streamToBeClosed(stream: Stream): Promise<void> {
  return new Promise((resolve) => {
    stream.on('close', () => {
      resolve();
    });
  });
}

async function main() {
  const stdinData = fs.readFileSync(0, 'utf8');

  if (stdinData === undefined || stdinData === '') {
    log('Expected text on stdin.');
    process.exit(1);
  }

  const cacheDirPath = getCacheDirPath();
  const filename = getFilenameForText(stdinData, config.voice, 'wav');
  const cachedFilePath = path.join(cacheDirPath, filename);

  if (fs.existsSync(cachedFilePath)) {
    log('Found cached file!');
    log(cachedFilePath);

    const cachedFileStream = fs.createReadStream(cachedFilePath);
    cachedFileStream.pipe(process.stdout);

    return;
  }

  log('No cached file found. Requesting speech data from AWS...');
  ensureCacheDirExists();

  const polly = new AWS.Polly({ apiVersion: '2016-06-10' });
  const params: SynthesizeSpeechInput = {
    OutputFormat: 'mp3',
    Text: stdinData,
    VoiceId: config.voice,
  };

  const result = await polly.synthesizeSpeech(params).promise();

  if (result.AudioStream === undefined) {
    log('Could not retrieve audio stream.');
    process.exit(1);
  }

  const wavAudioStream = convertMp3ToWav(result.AudioStream as Buffer);
  const wavCacheFileWriteStream = fs.createWriteStream(cachedFilePath);
  wavAudioStream.pipe(wavCacheFileWriteStream);

  await streamToBeClosed(wavCacheFileWriteStream);

  const wavCacheFileReadStream = fs.createReadStream(cachedFilePath);
  wavCacheFileReadStream.pipe(process.stdout);
}

main();
