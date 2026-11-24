"use strict";

const MIN_FREQUENCY = 10;
const MAX_FREQUENCY = 25000;

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

function readFrequency() {
  // rangeの値そのものがHz。変換や1000Hzでの上限処理は行わない。
  return Math.min(MAX_FREQUENCY, Math.max(MIN_FREQUENCY, Number(slider.value)));
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
  const frequency = readFrequency();
  const formattedFrequency = frequency.toLocaleString("ja-JP");

  frequencyValue.textContent = formattedFrequency;
  frequencyExplanation.textContent = getFrequencyExplanation(frequency);
  slider.setAttribute("aria-valuetext", `${formattedFrequency} Hz`);

  if (isPlaying && oscillator && audioContext) {
    // 既存のOscillatorNodeを維持したまま、表示と同じHzへ滑らかに更新
    oscillator.frequency.setTargetAtTime(frequency, audioContext.currentTime, 0.015);
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

    // 控えめな音量を維持
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

// DOMの範囲属性とJavaScriptの範囲定義の不一致を早期に検出
if (Number(slider.min) !== MIN_FREQUENCY || Number(slider.max) !== MAX_FREQUENCY) {
  throw new Error("スライダーの周波数範囲が設定と一致しません");
}
updateFrequency();
