// Called by Vapi's end-of-call webhook. Takes the transcript of the onboarding
// call and produces the session bundle: YAML config, deployed backend URL,
// new Vapi number for the generated agent, and a cited.md audit entry.

export interface VapiEndOfCallPayload {
  sessionId: string;
  callId: string;
  transcript: string;
  durationSeconds: number;
  endedReason: string;
}

export interface SessionBundle {
  yamlConfigUrl: string;
  backendUrl: string;
  agentPhoneNumber: string;
  citedMdEntryUrl: string;
}

export async function handleEndOfCall(
  payload: VapiEndOfCallPayload,
): Promise<SessionBundle> {
  // TODO: call LLM to extract structured config from transcript
  // TODO: render YAML from config
  // TODO: deploy backend to InsForge
  // TODO: provision new Vapi number for the generated agent
  // TODO: publish cited.md entry
  throw new Error("not implemented · scaffold only");
}
