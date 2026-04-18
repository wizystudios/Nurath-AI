import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
  /** When true, keeps the mic on after each utterance until user toggles off */
  continuous?: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscription, disabled = false, continuous = true }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldKeepListeningRef = useRef(false);
  const onTranscriptionRef = useRef(onTranscription);

  useEffect(() => { onTranscriptionRef.current = onTranscription; }, [onTranscription]);

  const stopListening = useCallback(() => {
    shouldKeepListeningRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false; // get final result per utterance, then auto-restart
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("")
        .trim();
      if (transcript) onTranscriptionRef.current(transcript);
    };

    recognition.onerror = (event: any) => {
      // Silently handle no-speech & aborts; only stop on permission errors
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        shouldKeepListeningRef.current = false;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (shouldKeepListeningRef.current && continuous) {
        // Auto-restart so the mic stays on until user clicks off
        try { recognition.start(); } catch { /* ignore */ }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    shouldKeepListeningRef.current = true;
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  }, [continuous]);

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  // Cleanup on unmount
  useEffect(() => () => stopListening(), [stopListening]);

  return (
    <Button
      type="button"
      size="icon"
      variant={isListening ? "default" : "ghost"}
      onClick={toggleListening}
      disabled={disabled}
      className="shrink-0"
      title={isListening ? "Turn off microphone" : "Turn on microphone"}
    >
      {isListening ? (
        <Mic className="h-5 w-5 animate-pulse" />
      ) : (
        <MicOff className="h-5 w-5" />
      )}
    </Button>
  );
};

export default VoiceInput;
