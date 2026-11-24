"use strict";

const MIN_FREQUENCY = 10;
const MAX_FREQUENCY = 25000;
const SLIDER_MAX = 1000;
const SLIDER_SEGMENTS = [
  { start: 0, end: 300, minHz: 10, maxHz: 100 },
  { start: 300, end: 550, minHz: 100, maxHz: 12000 },
  { start: 550, end: 900, minHz: 12000, maxHz: 20000 },
  { start: 900, end: 1000, minHz: 20000, maxHz: 25000 },
];

const slider = document.getElementById("frequencySlider");
const frequencyValue = document.getElementById("frequencyValue");
const frequencyExplanation = document.getElementById("frequencyExplanation");
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

  return Math.round(
    segment.minHz * (segment.maxHz / segment.minHz) ** progress
  );
}

function positionForFrequency(frequency) {
  const hz = Math.min(MAX_FREQUENCY, Math.max(MIN_FREQUENCY, frequency));
  const segment = SLIDER_SEGMENTS.find((item) => hz <= item.maxHz)
    || SLIDER_SEGMENTS[SLIDER_SEGMENTS.length - 1];
  const progress = Math.log(hz / segment.minHz)
    / Math.log(segment.maxHz / segment.minHz);

  return segment.start + progress * (segment.end - segment.start);
}

function readFrequency() {
  return frequencyAtPosition(slider.value);
}

function getFrequencyExplanation(frequency) {
  if (frequency < 20) {
    return "人間にも聞こえにくい、とても低い音です。音というより振動として感じることもあります。";
  }
  if (frequency < 65) {
    return "この音は、人間には聞こえることが多いですが、犬には聞こえにくい低い音です。";
  }
  if (frequency <= 20000) {
    return "人間にも犬にも聞こえるとされる音域です。";
  }
  return "人間には聞こえにくい高い音です。犬には聞こえるとされる音域です！";
}

function updateFrequency() {
  const frequency = readFrequency();
  const formattedFrequency = frequency.toLocaleString("ja-JP");

  frequencyValue.textContent = formattedFrequency;
  frequencyExplanation.textContent = getFrequencyExplanation(frequency);
  slider.setAttribute("aria-valuetext", `${formattedFrequency} Hz`);

  if (isPlaying && oscillator && audioContext) {
    oscillator.frequency.setTargetAtTime(
      frequency,
      audioContext.currentTime,
      0.015
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

slider.addEventListener("input", updateFrequency);
startButton.addEventListener("click", startSound);
stopButton.addEventListener("click", stopSound);

window.addEventListener("pagehide", stopSound);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopSound();
  }
});

window.addEventListener("blur", stopSound);

if (
  Number(slider.min) !== 0
  || Number(slider.max) !== SLIDER_MAX
  || Number(slider.step) !== 0.01
) {
  throw new Error("スライダーの位置範囲が設定と一致しません");
}

slider.value = String(positionForFrequency(1000));
updateFrequency();
