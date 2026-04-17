import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { AppSettings, AspectRatio } from '@/types';
import { Clock, Sparkles, Youtube, Instagram, Smartphone, Maximize, Square, MonitorSmartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ClipSettingsProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

const PRESETS = [
  { name: 'TikTok', duration: 15, icon: Smartphone, color: 'text-pink-500', ratio: '9:16' as AspectRatio },
  { name: 'Shorts', duration: 60, icon: Youtube, color: 'text-red-500', ratio: '9:16' as AspectRatio },
  { name: 'Reels', duration: 30, icon: Instagram, color: 'text-purple-500', ratio: '9:16' as AspectRatio },
];

const RATIOS: { label: string; value: AspectRatio; icon: any }[] = [
  { label: 'Original', value: 'original', icon: Maximize },
  { label: 'Vertical', value: '9:16', icon: Smartphone },
  { label: 'Square', value: '1:1', icon: Square },
  { label: 'Wide', value: '16:9', icon: MonitorSmartphone },
];

export const ClipSettings: React.FC<ClipSettingsProps> = ({ settings, onSettingsChange }) => {
  const handleDurationChange = (val: number) => {
    const sanitizedVal = Math.max(1, Math.min(120, val));
    onSettingsChange({ ...settings, clipDuration: sanitizedVal });
  };

  const handleRatioChange = (ratio: AspectRatio) => {
    onSettingsChange({ ...settings, aspectRatio: ratio });
  };

  return (
    <Card className="h-full border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Clip Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-0">
        {/* Presets */}
        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Presets</Label>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  onSettingsChange({ 
                    ...settings, 
                    clipDuration: preset.duration,
                    aspectRatio: preset.ratio 
                  });
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all hover:bg-muted/50 ${
                  settings.clipDuration === preset.duration && settings.aspectRatio === preset.ratio
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-muted bg-white'
                }`}
              >
                <preset.icon className={`w-5 h-5 mb-1 ${preset.color}`} />
                <span className="text-[10px] font-bold">{preset.name}</span>
                <span className="text-[9px] text-muted-foreground">{preset.duration}s • {preset.ratio}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Aspect Ratio</Label>
          <div className="grid grid-cols-2 gap-2">
            {RATIOS.map((r) => (
              <button
                key={r.value}
                onClick={() => handleRatioChange(r.value)}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all hover:bg-muted/50 ${
                  settings.aspectRatio === r.value
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-muted bg-white'
                }`}
              >
                <r.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold">{r.label}</span>
                <span className="text-[10px] text-muted-foreground ml-auto uppercase">{r.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Duration */}
        <div className="p-4 rounded-2xl bg-white border border-muted shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="w-4 h-4 text-primary" />
              Clip Duration
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={settings.clipDuration}
                onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0)}
                className="w-16 h-8 text-xs font-mono text-center p-0"
                min={1}
                max={300}
              />
              <span className="text-xs font-medium text-muted-foreground">sec</span>
            </div>
          </div>
          
          <div className="px-2">
            <Slider
              value={[settings.clipDuration]}
              min={1}
              max={120}
              step={1}
              onValueChange={(vals) => handleDurationChange(vals[0])}
              className="py-4"
            />
          </div>
          
          <div className="flex justify-between text-[10px] text-muted-foreground px-1 font-mono">
            <span>1s</span>
            <span>60s</span>
            <span>120s</span>
          </div>
        </div>

        {/* Toggle Switches */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-muted shadow-sm">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="w-4 h-4 text-primary" />
                Smart Split (AI)
              </Label>
              <p className="text-[10px] text-muted-foreground">
                AI finds interesting moments
              </p>
            </div>
            <Switch
              checked={settings.smartSplit}
              onCheckedChange={(val) => onSettingsChange({ ...settings, smartSplit: val })}
            />
          </div>
        </div>

        {/* Transitions */}
        <div className="space-y-3">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Transition Style</Label>
          <div className="grid grid-cols-3 gap-2">
            {(['none', 'fade', 'slide'] as const).map((type) => (
              <button
                key={type}
                onClick={() => onSettingsChange({ ...settings, transitionType: type })}
                className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                  settings.transitionType === type
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white hover:bg-muted border-muted'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
