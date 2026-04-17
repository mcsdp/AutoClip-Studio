import React, { useCallback } from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';
import { Upload, Video } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface VideoUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({ onFileSelect, selectedFile }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const options: any = {
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'video/x-msvideo': ['.avi'],
      'video/x-matroska': ['.mkv']
    },
    multiple: false
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone(options);

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "relative group cursor-pointer border-2 border-dashed transition-all duration-300 p-12 flex flex-col items-center justify-center gap-4",
        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50",
        selectedFile && "border-primary/50 bg-primary/5"
      )}
    >
      <input {...getInputProps()} />
      
      <div className="relative">
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
          selectedFile ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          {selectedFile ? <Video className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
        </div>
        {selectedFile && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
        )}
      </div>

      <div className="text-center">
        <h3 className="text-lg font-medium">
          {selectedFile ? selectedFile.name : "Upload your video"}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedFile 
            ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
            : "Drag and drop or click to browse"
          }
        </p>
      </div>

      {!selectedFile && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {['MP4', 'MOV', 'AVI', 'MKV'].map(format => (
            <span key={format} className="px-2 py-1 rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
              {format}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
};
