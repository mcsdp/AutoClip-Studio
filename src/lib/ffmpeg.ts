import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { AspectRatio } from '../types';

let ffmpeg: FFmpeg | null = null;

export const getFFmpeg = async () => {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();
  
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpeg;
};

export const prepareSource = async (ffmpeg: FFmpeg, inputFile: File): Promise<string> => {
  const inputName = 'input.mp4';
  const data = await inputFile.arrayBuffer();
  await ffmpeg.writeFile(inputName, new Uint8Array(data));
  return inputName;
};

export const cutVideo = async (
  ffmpeg: FFmpeg,
  inputName: string,
  startTime: number,
  duration: number,
  outputName: string,
  aspectRatio: AspectRatio = 'original'
): Promise<Blob> => {
  const args = [
    '-ss', startTime.toFixed(3),
    '-i', inputName,
    '-t', duration.toFixed(3),
  ];

  if (aspectRatio === 'original') {
    args.push('-c:v', 'copy', '-c:a', 'copy', '-avoid_negative_ts', '1');
  } else {
    // We need to re-encode to apply filters
    let filter = '';
    if (aspectRatio === '9:16') {
      filter = 'crop=ih*9/16:ih';
    } else if (aspectRatio === '1:1') {
      filter = 'crop=min(iw\\,ih):min(iw\\,ih)';
    } else if (aspectRatio === '16:9') {
      filter = 'crop=iw:iw*9/16';
    }

    // -crf 23 is a good balance of quality/size, -preset ultrafast is for speed
    args.push(
      '-vf', filter,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k'
    );
  }

  args.push(outputName);

  await ffmpeg.exec(args);

  const outputData = await ffmpeg.readFile(outputName);
  return new Blob([outputData], { type: 'video/mp4' });
};
