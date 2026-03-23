/**
 * Rest timer completion: soft beep + vibration (+ Capacitor Haptics when available).
 */

export function playRestCompleteAlerts(): void {
  if (typeof window === "undefined") return;

  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    const t0 = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
    osc.start(t0);
    osc.stop(t0 + 0.25);
    void ctx.resume?.();
  } catch {
    /* ignore */
  }

  try {
    if (navigator.vibrate) {
      navigator.vibrate([100, 40, 100]);
    }
  } catch {
    /* ignore */
  }

  void import("@capacitor/haptics")
    .then(({ Haptics, ImpactStyle }) => {
      void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    })
    .catch(() => {});
}
