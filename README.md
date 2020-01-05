# Node TTS Polly

Convert text to speech using AWS Polly and Node.js.

## Requirements

- Node.js `>= 12.x`
- FFmpeg
- an Amazon Web Service (AWS) account

## Installation

### From GitHub Package Registry

```
$ npm install -g --registry https://npm.pkg.github.com/nullent1ty @nullent1ty/tts-polly
```

### From sources

```
$ git clone https://github.com/NullEnt1ty/node-tts-polly
$ cd node-tts-polly
$ npm install -g
```

## Usage

Node TTS Polly can be called from the command line using `tts-polly`. Text is
read from standard input and given out as wav sound using standard output.

For example:

```
$ printf "This text will be synthesized" | tts-polly > synthesized-text.wav
```

Make sure to set the environment variable `AWS_SDK_LOAD_CONFIG` to a truthy
value to load config and credentials from the `~/.aws` directory.

```
$ export AWS_SDK_LOAD_CONFIG=1
```

For more information see this article:
https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html

## Configuration

The used voice can be configured by editing `src/app.ts`. There will be a proper
CLI in the future.

## Additional information

Speech data will be cached in `$tmp_dir/node-tts-polly/cache`. Node TTS Polly
won't make another request to AWS if the text was already synthesized in the
past. This helps to minimize cost, traffic and processing time.
