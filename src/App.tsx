/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, Component, ReactNode } from 'react';
import { VideoUploader } from './components/VideoUploader';
import { ClipSettings } from './components/ClipSettings';
import { ClipList } from './components/ClipList';
import { AppSettings, VideoClip } from './types';
import { getFFmpeg, cutVideo, prepareSource } from './lib/ffmpeg';
import { analyzeVideo } from './lib/gemini';
import { Button } from '@/components/ui/button';
import { Scissors, Sparkles, AlertCircle, CheckCircle2, Loader2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Root App with basic error handling for SharedArrayBuffer/Loading issues
export default function App() {
  const [entryError, setEntryError] = useState<any>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('SharedArrayBuffer') || event.message.includes('FFmpeg')) {
        setEntryError(event.error || { message: event.message });
      }
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (entryError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <Alert variant="destructive" className="max-w-md bg-white border-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Compatibility Issue</AlertTitle>
          <AlertDescription className="mt-2 text-slate-900">
            <p className="mb-4">This browser is restricting high-performance features required for video cutting (SharedArrayBuffer). This is common in Incognito mode.</p>
            <pre className="text-[10px] bg-slate-100 p-2 rounded overflow-auto max-h-32 mb-4">
              {String(entryError?.message || entryError)}
            </pre>
            <Button className="w-full" onClick={() => window.location.reload()}>
              Try Reloading
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <MainApp />;
}

function MainApp() {
  useEffect(() => {
    console.log("AutoClip Studio Initialized. SAB:", typeof SharedArrayBuffer !== 'undefined');
    if (typeof SharedArrayBuffer === 'undefined') {
      console.warn("SharedArrayBuffer is missing. FFmpeg might not load.");
    }
  }, []);
  const [file, setFile] = useState<File | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    clipDuration: 35,
    aspectRatio: 'original',
    smartSplit: true,
    transitionType: 'none',
  });
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [previewClip, setPreviewClip] = useState<VideoClip | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (file) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        setVideoDuration(video.duration);
      };
      video.src = URL.createObjectURL(file);
    }
  }, [file]);

  const handleProcess = async () => {
    if (!file || videoDuration === 0) return;

    setIsProcessing(true);
    setError(null);
    setClips([]);
    setProcessingStatus('AI Analysis...');

    try {
      const ffmpeg = await getFFmpeg();
      
      // 1. Optimized AI Analysis
      const analysisResults = await analyzeVideo(
        file, 
        settings.clipDuration, 
        settings.smartSplit ? 'smart' : 'fixed'
      );

      if (analysisResults.length === 0) {
        throw new Error("AI could not analyze the video properly. Try a different video.");
      }

      setProcessingStatus('Loading engine...');
      const inputName = await prepareSource(ffmpeg, file);

      const newClips: VideoClip[] = analysisResults.map(res => ({
        id: Math.random().toString(36).substr(2, 9),
        startTime: res.startTime,
        endTime: res.startTime + settings.clipDuration,
        duration: settings.clipDuration,
        status: 'pending',
      }));
      setClips(newClips);

      setProcessingStatus('Turbo cutting...');

      // Process in batches (2 at a time) to maximize browser resources
      const BATCH_SIZE = 2;
      for (let i = 0; i < newClips.length; i += BATCH_SIZE) {
        const batch = newClips.slice(i, i + BATCH_SIZE);
        setProcessingStatus(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}...`);
        
        await Promise.all(batch.map(async (clip) => {
          setClips(prev => prev.map(c => c.id === clip.id ? { ...c, status: 'processing' } : c));
          
          try {
            const outputName = `clip_${clip.id}.mp4`;
            // Pass aspectRatio to cutVideo
            const blob = await cutVideo(
              ffmpeg, 
              inputName, 
              clip.startTime, 
              clip.duration, 
              outputName,
              settings.aspectRatio
            );
            const blobUrl = URL.createObjectURL(blob);

            setClips(prev => prev.map(c => c.id === clip.id ? { 
              ...c, 
              status: 'completed', 
              blobUrl 
            } : c));
          } catch (err) {
            console.error(`Clip error:`, err);
            setClips(prev => prev.map(c => c.id === clip.id ? { ...c, status: 'error' } : c));
          }
        }));
      }

    } catch (err: any) {
      console.error('Workflow error:', err);
      setError(err?.message || 'Processing failed. Please check your internet connection.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleExport = (clip: VideoClip) => {
    if (!clip.blobUrl) return;
    const a = document.createElement('a');
    a.href = clip.blobUrl;
    a.download = `clip_${clip.id}.mp4`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans selection:bg-primary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">AutoClip <span className="text-primary">Studio</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">v1.0 Beta</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Upload & Settings */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {!file ? (
              <VideoUploader onFileSelect={setFile} selectedFile={file} />
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center">
                      <Scissors className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold truncate max-w-[150px]">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(1)} MB • {Math.floor(videoDuration)}s</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setFile(null); setClips([]); }} className="text-xs h-8">
                    Change
                  </Button>
                </div>
                
                <ClipSettings settings={settings} onSettingsChange={setSettings} />
                
                <Button 
                  className="w-full h-14 text-lg font-semibold shadow-lg shadow-primary/20 group"
                  size="lg"
                  disabled={isProcessing}
                  onClick={handleProcess}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {processingStatus || 'Cutting...'}
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2 group-hover:animate-pulse text-yellow-400 fill-yellow-400" />
                      Turbo Cut
                    </>
                  )}
                </Button>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="rounded-2xl border-destructive/20 bg-destructive/5">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Right Column: Clips Display */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                Generated Clips
                {clips.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({clips.filter(c => c.status === 'completed').length}/{clips.length})
                  </span>
                )}
              </h2>
              {clips.length > 0 && clips.every(c => c.status === 'completed') && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  All clips ready
                </div>
              )}
            </div>

            <ClipList 
              clips={clips} 
              onExport={handleExport} 
              onPreview={setPreviewClip} 
            />
          </div>
        </div>
      </main>

      {/* Preview Dialog */}
      <Dialog open={!!previewClip} onOpenChange={() => setPreviewClip(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Clip Preview</DialogTitle>
          </DialogHeader>
          {previewClip?.blobUrl && (
            <div className="relative group flex items-center justify-center min-h-[400px]">
              <video 
                src={previewClip.blobUrl} 
                className={`max-h-[80vh] ${settings.aspectRatio === '9:16' ? 'aspect-[9/16]' : settings.aspectRatio === '1:1' ? 'aspect-square' : 'aspect-video'}`}
                controls
                autoPlay
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="mt-20 border-t py-12 bg-white">
        <div className="container mx-auto px-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 opacity-50">
            <Scissors className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-widest">AutoClip Studio</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
