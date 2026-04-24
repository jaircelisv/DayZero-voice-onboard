// Minimal typing of the Vapi server event payload we care about.
// Full schema: https://docs.vapi.ai/server-url/events

export type VapiServerEventType =
  | "end-of-call-report"
  | "transcript"
  | "status-update"
  | "function-call"
  | "hang"
  | "speech-update"
  | "user-interrupted";

export interface VapiTranscriptMessage {
  role: "user" | "assistant" | "system" | "tool";
  message: string;
  time?: number;
  endTime?: number;
  secondsFromStart?: number;
}

export interface VapiEndOfCallReport {
  type: "end-of-call-report";
  call: {
    id: string;
    phoneNumberId?: string;
    customer?: { number?: string };
    assistantId?: string;
    startedAt?: string;
    endedAt?: string;
    endedReason?: string;
  };
  transcript?: string;
  messages?: VapiTranscriptMessage[];
  summary?: string;
  recordingUrl?: string;
  stereoRecordingUrl?: string;
  cost?: number;
  costBreakdown?: Record<string, number>;
  durationSeconds?: number;
}

export interface VapiServerEventEnvelope {
  message: VapiEndOfCallReport | { type: VapiServerEventType; [k: string]: unknown };
}
