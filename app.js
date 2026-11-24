"use strict";

const slider = document.getElementById("frequencySlider");
const frequencyValue = document.getElementById("frequencyValue");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const status = document.getElementById("status");

let audioContext = null;
let oscillator = null;
let gainNode = null;
let isPlaying = false;

function updateFrequencyDisplay() {
  const frequency = Number(slider.value);
  frequencyValue.textContent = String(frequency);

  if (isPlaying && oscillator && audioContext) {
    oscillator.frequency.setTargetAtTime(
      frequency,
      audioContext.currentTime,
      0.008
    );
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
      Number(slider.value),
      audioContext.currentTime
    );

    // 高い周波数でも不快になりすぎないよう、低めの音量を設定
    gainNode.gain.setValueAtTime(0.035, audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();

    isPlaying = true;
    startButton.disabled = true;
    stopButton.disabled = false;
    status.textContent = `再生中：${slider.value} Hz`;
    status.classList.add("playing");
  } catch (error) {
    stopSound();
    status.textContent = "音声の開始に失敗しました";
  }
}

slider.addEventListener("input", updateFrequencyDisplay);
slider.addEventListener("input", () => {
  if (isPlaying) {
    status.textContent = `再生中：${slider.value} Hz`;
  }
});
startButton.addEventListener("click", startSound);
stopButton.addEventListener("click", stopSound);

window.addEventListener("pagehide", stopSound);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopSound();
  }
});

window.addEventListener("blur", () => {
  stopSound();
});

updateFrequencyDisplay();
