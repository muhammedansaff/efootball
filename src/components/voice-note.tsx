'use client';

import { useState, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { AudioRecorder, formatDuration, type VoiceRecording } from '@/lib/audio-recorder';

interface VoiceNoteRecorderProps {
  onRecordingComplete: (recording: VoiceRecording) => void;
  onCancel: () => void;
}

export function VoiceNoteRecorder({ onRecordingComplete, onCancel }: VoiceNoteRecorderProps) {
  const [recorder] = useState(() => new AudioRecorder());
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRecording) {
      interval = setInterval(() => {
        setDuration(recorder.getCurrentDuration());
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, recorder]);

  const handleStartRecording = async () => {
    try {
      setError(null);
      await recorder.startRecording();
      setIsRecording(true);
    } catch (err: any) {
      setError(err.message || 'Failed to start recording');
      console.error('Recording error:', err);
    }
  };

  const handleStopRecording = async () => {
    try {
      const recording = await recorder.stopRecording();
      setIsRecording(false);
      onRecordingComplete(recording);
    } catch (err) {
      setError('Failed to save recording');
      console.error('Stop recording error:', err);
    }
  };

  const handleCancelRecording = () => {
    recorder.cancelRecording();
    setIsRecording(false);
    onCancel();
  };

  useEffect(() => {
    // Auto-start recording when component mounts
    handleStartRecording();
    
    return () => {
      // Cleanup on unmount
      if (recorder.isRecording()) {
        recorder.cancelRecording();
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
      {/* Recording indicator */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-3 h-3 rounded-full animate-pulse",
          isRecording ? "bg-red-500" : "bg-muted-foreground"
        )} />
        <span className="text-sm font-medium">
          {formatDuration(duration)} / 0:10
        </span>
      </div>

      {/* Waveform animation */}
      {isRecording && (
        <div className="flex items-center gap-1 flex-1">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-primary rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 20 + 10}px`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <span className="text-sm text-destructive flex-1">{error}</span>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="destructive"
          onClick={handleCancelRecording}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          onClick={handleStopRecording}
          disabled={!isRecording || duration < 0.5}
        >
          <Square className="h-4 w-4 mr-1" />
          Done
        </Button>
      </div>
    </div>
  );
}

interface VoiceNotePlayerProps {
  voiceNote: {
    data: string;
    duration: number;
  };
  className?: string;
}

export function VoiceNotePlayer({ voiceNote, className }: VoiceNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audio] = useState(() => new Audio(voiceNote.data));

  useEffect(() => {
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, [audio]);

  const togglePlay = () => {
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const progress = (currentTime / voiceNote.duration) * 100;

  return (
    <div className={cn("flex items-center gap-3 p-2 bg-muted/30 rounded-lg", className)}>
      {/* Play/Pause button */}
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 flex-shrink-0"
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      {/* Waveform/Progress */}
      <div className="flex-1 relative h-8 flex items-center">
        <div className="absolute inset-0 flex items-center gap-0.5">
          {[...Array(30)].map((_, i) => {
            const barProgress = (i / 30) * 100;
            const isActive = barProgress <= progress;
            return (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-full transition-colors",
                  isActive ? "bg-primary" : "bg-muted-foreground/30"
                )}
                style={{
                  height: `${Math.random() * 60 + 40}%`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Duration */}
      <span className="text-xs text-muted-foreground flex-shrink-0 w-10 text-right">
        {formatDuration(isPlaying ? currentTime : voiceNote.duration)}
      </span>
    </div>
  );
}
