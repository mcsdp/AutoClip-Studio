export interface VideoClip {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  blobUrl?: string;
  textOverlays?: TextOverlay[];
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export interface TextOverlay {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  position: { x: number; y: number };
  style: {
    fontSize: number;
    color: string;
    backgroundColor?: string;
  };
}

export type AspectRatio = 'original' | '9:16' | '1:1' | '16:9';

export interface AppSettings {
  clipDuration: number;
  smartSplit: boolean;
  aspectRatio: AspectRatio;
  transitionType: 'none' | 'fade' | 'slide';
}
