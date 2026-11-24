"use strict";

const MIN_FREQUENCY = 10;
const MAX_FREQUENCY = 25000;
const SLIDER_MAX = 1000;
const SLIDER_SEGMENTS = [
  { start: 0, end: 350, minHz: 10, maxHz: 100 },
  { start: 350, end: 550, minHz: 100, maxHz: 1000 },
  { start: 550, end: 900, minHz: 1000, maxHz: 15000 },
  { start: 900, end: 1000, minHz: 15000, maxHz: 25000 },
];

const slider = document.getElementById("frequencySlider");
const frequencyValue = document.getElementById("frequencyValue");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const status = document.getElementById("status");

let audioContext = null;
let oscillator = null;
let gainNode = null;
let isPlaying = false;

function frequencyAtPosition(position) {
  const x = Math.min(SLIDER_MAX, Math.max(0, Number(position)));
  const segment = SLIDER_SEGMENTS.find((item) => x <= item.end)
    || SLIDER_SEGMENTS[SLIDER_SEGMENTS.length - 1];
  const progress = (x - segment.start) / (segment.end - segment.start);
  return Math.round(segment.minHz * (segment.maxHz / segment.minHz) ** progress);
}

function positionForFrequency(frequency) {
  const hz = Math.min(MAX_FREQUENCY, Math.max(MIN_FREQUENCY, frequency));
  const segment = SLIDER_SEGMENTS.find((item) => hz <= item.maxHz)
    || SLIDER_SEGMENTS[SLIDER_SEGMENTS.length - 1];
  const progress = Math.log(hz / segment.minHz) / Math.log(segment.maxHz / segment.minHz);
  return segment.start + progress * (segment.end - segment.start);
}

function readFrequency() {
  return frequencyAtPosition(slider.value);
}

function updateFrequencyDisplay() {
  const frequency = readFrequency();
  const formattedFrequency = frequency.toLocaleString("ja-JP");
  frequencyValue.textContent = formattedFrequency;
  slider.setAttribute("aria-valuetext", `${formattedFrequency} Hz`);

  if (isPlaying && oscillator && audioContext) {
    oscillator.frequency.setTargetAtTime(
      frequency,
      audioContext.currentTime,
      0.008
    );
    status.textContent = `再生中：${formattedFrequency} Hz`;
  }
}

function stopSound() {
  if (oscillator) {
    try {
      oscillator.stop();
    } catch (error) {
      // すでに停止している場合は無視する
    }
    oscillator.disconnect();
    oscillator = null;
  }

  if (gainNode) {
    gainNode.disconnect();
    gainNode = null;
  }

  isPlaying = false;
  startButton.disabled = false;
  stopButton.disabled = true;
  status.textContent = "停止中";
  status.classList.remove("playing");
}

async function startSound() {
  if (isPlaying) {
    return;
  }

  try {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        status.textContent = "このブラウザでは音声を再生できません";
        return;
      }
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    oscillator = audioContext.createOscillator();
    gainNode = audioContext.createGain();

    const frequency = readFrequency();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

    // 既存の控えめな音量設定を維持
    gainNode.gain.setValueAtTime(0.035, audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();

    isPlaying = true;
    startButton.disabled = true;
    stopButton.disabled = false;
    status.textContent = `再生中：${frequency.toLocaleString("ja-JP")} Hz`;
    status.classList.add("playing");
  } catch (error) {
    stopSound();
    status.textContent = "音声の開始に失敗しました";
  }
}

slider.addEventListener("input", updateFrequencyDisplay);
startButton.addEventListener("click", startSound);
stopButton.addEventListener("click", stopSound);

window.addEventListener("pagehide", stopSound);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopSound();
  }
});

window.addEventListener("blur", stopSound);

// 1,000Hzを初期値にし、表示とOscillatorNodeの同じ変換値を使う
slider.value = String(positionForFrequency(1000));
updateFrequencyDisplay();
