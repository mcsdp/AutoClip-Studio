import React from 'react';
import { VideoClip } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Play, Loader2, Scissors } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ClipListProps {
  clips: VideoClip[];
  onExport: (clip: VideoClip) => void;
  onPreview: (clip: VideoClip) => void;
}

export const ClipList: React.FC<ClipListProps> = ({ clips, onExport, onPreview }) => {
  if (clips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed rounded-2xl">
        <Scissors className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm">No clips generated yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clips.map((clip) => (
        <Card key={clip.id} className="overflow-hidden group">
          <div className="aspect-video bg-black relative flex items-center justify-center">
            {clip.blobUrl ? (
              <video 
                src={clip.blobUrl} 
                className="w-full h-full object-cover"
                onMouseEnter={(e) => e.currentTarget.play()}
                onMouseLeave={(e) => {
                  e.currentTarget.pause();
                  e.currentTarget.currentTime = 0;
                }}
                muted
                loop
              />
            ) : (
              <div className="flex flex-col items-center gap-3 p-6 w-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <div className="w-full space-y-1">
                  <p className="text-[10px] text-center font-medium uppercase tracking-wider">Processing Clip...</p>
                  <Progress value={clip.status === 'processing' ? 65 : 10} className="h-1" />
                </div>
              </div>
            )}
            
            {clip.blobUrl && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="icon" variant="secondary" onClick={() => onPreview(clip)}>
                  <Play className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="secondary" onClick={() => onExport(clip)}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-sm">Clip #{clip.id.slice(0, 4)}</h4>
              <Badge variant="outline" className="text-[10px]">
                {clip.duration}s
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Starts at {Math.floor(clip.startTime / 60)}:{(clip.startTime % 60).toString().padStart(2, '0')}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
