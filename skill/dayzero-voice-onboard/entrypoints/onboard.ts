// Opens an onboarding session. Called when the user invokes the skill
// (/dayzero-onboard in Claude Code, @dayzero in Copilot, etc.).

export interface OnboardSession {
  sessionId: string;
  number: string;
  webhookUrl: string;
  createdAt: string;
}

export async function openSession(): Promise<OnboardSession> {
  const sessionId = `dz_${Math.random().toString(36).slice(2, 10)}`;
  return {
    sessionId,
    number: "+1 (443) 391-9140",
    webhookUrl: "https://api.dayzero.dev/vapi/transcript",
    createdAt: new Date().toISOString(),
  };
}
