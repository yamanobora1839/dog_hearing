"use strict";

const MIN_FREQUENCY = 10;
const MAX_FREQUENCY = 25000;
const SLIDER_MAX = 1000;

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

function sliderPositionToFrequency(position) {
  const ratio = position / SLIDER_MAX;
  return Math.round(MIN_FREQUENCY * (MAX_FREQUENCY / MIN_FREQUENCY) ** ratio);
}

function frequencyToSliderPosition(frequency) {
  return Math.round(
    (Math.log(frequency / MIN_FREQUENCY) / Math.log(MAX_FREQUENCY / MIN_FREQUENCY)) * SLIDER_MAX
  );
}

function getFrequencyExplanation(frequency) {
  if (frequency < 20) {
    return "人間にも聞こえにくい、とても低い音です。音というより振動として感じることもあります。";
  }
  if (frequency < 65) {
    return "この音は、人間には聞こえることがありますが、犬には聞こえにくい低い音です。";
  }
  if (frequency <= 20000) {
    return "人間にも犬にも聞こえる可能性がある音域です。";
  }
  return "人間には聞こえにくい高い音です。犬には聞こえる可能性があります！";
}

function updateFrequency() {
  const frequency = sliderPositionToFrequency(Number(slider.value));
  frequencyValue.textContent = frequency.toLocaleString("ja-JP");
  frequencyExplanation.textContent = getFrequencyExplanation(frequency);
  slider.setAttribute("aria-valuetext", `${frequency.toLocaleString("ja-JP")} Hz`);

  if (isPlaying && oscillator && audioContext) {
    // 同じOscillatorNodeの周波数だけを滑らかに更新し、再生を継続する
    oscillator.frequency.setTargetAtTime(frequency, audioContext.currentTime, 0.015);
  }

  if (isPlaying) {
    status.textContent = `再生中：${frequency.toLocaleString("ja-JP")} Hz`;
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

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      sliderPositionToFrequency(Number(slider.value)),
      audioContext.currentTime
    );

    // 控えめな音量を維持
    gainNode.gain.setValueAtTime(0.035, audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();

    isPlaying = true;
    startButton.disabled = true;
    stopButton.disabled = false;
    status.textContent = `再生中：${frequencyValue.textContent} Hz`;
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

slider.value = String(frequencyToSliderPosition(10000));
updateFrequency();
