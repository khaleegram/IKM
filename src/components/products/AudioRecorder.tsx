'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Play, Pause, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AudioRecorderProps {
  audioUrl?: string;
  onAudioChange: (audioUrl: string | undefined) => void;
}

export function AudioRecorder({ audioUrl, onAudioChange }: AudioRecorderProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        variant: 'destructive',
        title: 'Recording Failed',
        description: 'Could not access microphone. Please check permissions.',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playRecording = () => {
    if (recordedBlob && !audioUrl) {
      const audioUrl = URL.createObjectURL(recordedBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play();
      setIsPlaying(true);
    } else if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setIsPlaying(true);
    }
  };

  const stopPlaying = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const uploadAudio = async () => {
    if (!recordedBlob) return;

    setIsUploading(true);

    try {
      // Convert blob to file
      const audioFile = new File([recordedBlob], 'audio-description.webm', {
        type: 'audio/webm',
      });

      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('folder', 'products/audio');

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onAudioChange(data.url);
      setRecordedBlob(null);
      
      toast({
        title: 'Success',
        description: 'Audio description uploaded successfully.',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Failed to upload audio. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const deleteRecording = () => {
    setRecordedBlob(null);
    onAudioChange(undefined);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Voice Description (Optional)
          </Label>
          <p className="text-xs text-muted-foreground">
            Record a description in Hausa, Pidgin, or English. Many sellers are better at speaking than typing.
          </p>

          {audioUrl ? (
            <div className="space-y-2">
              <audio src={audioUrl} controls className="w-full" />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={deleteRecording}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Recording
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {!recordedBlob ? (
                <div className="flex gap-2">
                  {!isRecording ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={startRecording}
                    >
                      <Mic className="mr-2 h-4 w-4" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={stopRecording}
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      Stop Recording
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={isPlaying ? stopPlaying : playRecording}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Play
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    onClick={uploadAudio}
                    disabled={isUploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? 'Uploading...' : 'Save Recording'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={deleteRecording}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

