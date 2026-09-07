/**
 * Playback & Animation Controller
 * Handles timeline scrubbing, play/pause, speed management, and step dispatching.
 */

export class AnimationController {
  constructor({ onStepChange, onPlayStateChange }) {
    this.steps = [];
    this.currentStepIndex = -1;
    this.isPlaying = false;
    this.timer = null;
    this.speedMultiplier = 1.0;
    this.baseDelayMs = 900; // Base animation interval in ms

    this.onStepChange = onStepChange || (() => {});
    this.onPlayStateChange = onPlayStateChange || (() => {});
  }

  loadSteps(steps, autoPlay = false) {
    this.pause();
    this.steps = steps || [];
    this.currentStepIndex = -1;

    if (this.steps.length > 0) {
      this.currentStepIndex = 0;
      this.dispatchCurrentStep();
      if (autoPlay) {
        this.play();
      }
    } else {
      this.dispatchCurrentStep();
    }
  }

  setSpeed(multiplier) {
    this.speedMultiplier = Math.max(0.2, Math.min(multiplier, 5.0));
    if (this.isPlaying) {
      // Reset timer with new speed
      this.pause();
      this.play();
    }
  }

  play() {
    if (this.isPlaying) return;
    if (this.steps.length === 0) return;

    // If at end, restart from beginning
    if (this.currentStepIndex >= this.steps.length - 1) {
      this.currentStepIndex = 0;
      this.dispatchCurrentStep();
    }

    this.isPlaying = true;
    this.onPlayStateChange(true);

    const tick = () => {
      if (!this.isPlaying) return;

      if (this.currentStepIndex < this.steps.length - 1) {
        this.currentStepIndex++;
        this.dispatchCurrentStep();
        const delay = this.baseDelayMs / this.speedMultiplier;
        this.timer = setTimeout(tick, delay);
      } else {
        this.pause();
      }
    };

    const delay = this.baseDelayMs / this.speedMultiplier;
    this.timer = setTimeout(tick, delay);
  }

  pause() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.isPlaying) {
      this.isPlaying = false;
      this.onPlayStateChange(false);
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  stepForward() {
    this.pause();
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      this.dispatchCurrentStep();
      return true;
    }
    return false;
  }

  stepBackward() {
    this.pause();
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.dispatchCurrentStep();
      return true;
    }
    return false;
  }

  jumpToStep(index) {
    this.pause();
    if (index >= 0 && index < this.steps.length) {
      this.currentStepIndex = index;
      this.dispatchCurrentStep();
    }
  }

  jumpToStart() {
    this.jumpToStep(0);
  }

  jumpToEnd() {
    this.jumpToStep(this.steps.length - 1);
  }

  dispatchCurrentStep() {
    const step = this.steps[this.currentStepIndex] || null;
    this.onStepChange(step, this.currentStepIndex, this.steps.length);
  }

  getCurrentStep() {
    return this.steps[this.currentStepIndex] || null;
  }
}
