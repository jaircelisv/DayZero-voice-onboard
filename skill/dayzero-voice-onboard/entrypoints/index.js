// DayZero voice-onboard · local runtime shim
// Loaded by Shipables after install. Keeps logic minimal — real work happens
// on the remote service reached via the phone number + webhook.

module.exports = {
  name: "@dayzero/voice-onboard",
  version: "0.1.0",
  onboardingNumber: "+14433919140",
  sessionApi: "https://api.dayzero.dev/sessions",

  async install({ io }) {
    io.log("DayZero installed.");
    io.log(`Call ${this.onboardingNumber} to configure your first agent.`);
    io.log("Your IDE will receive the session bundle in ~60 seconds.");
  },

  async onboard({ io }) {
    const sessionId = `dz_${Math.random().toString(36).slice(2, 8)}`;
    io.log(`Session ${sessionId} opened.`);
    io.log(`Dial ${this.onboardingNumber} and describe your business.`);
    return { sessionId, number: this.onboardingNumber };
  },
};
