<template>
  <div class="loading-container" :class="{ overlay: isOverlay }">
    <div class="loading-content">
      <!-- 默认加载动画 -->
      <div v-if="type === 'default'" class="spinner-default">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>

      <!-- 点状加载动画 -->
      <div v-else-if="type === 'dots'" class="spinner-dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>

      <!-- 脉冲加载动画 -->
      <div v-else-if="type === 'pulse'" class="spinner-pulse">
        <div class="pulse-circle"></div>
      </div>

      <!-- 波浪加载动画 -->
      <div v-else-if="type === 'wave'" class="spinner-wave">
        <div class="wave-bar"></div>
        <div class="wave-bar"></div>
        <div class="wave-bar"></div>
        <div class="wave-bar"></div>
        <div class="wave-bar"></div>
      </div>

      <!-- 文件处理特定动画 -->
      <div v-else-if="type === 'file'" class="spinner-file">
        <div class="file-icon">📁</div>
        <div class="processing-dots">
          <span>处理中</span>
          <span class="dot-1">.</span>
          <span class="dot-2">.</span>
          <span class="dot-3">.</span>
        </div>
      </div>

      <!-- 加载文本 -->
      <div v-if="text" class="loading-text" :class="{ typewriter: typewriterEffect }">
        {{ text }}
      </div>

      <!-- 进度条 -->
      <div v-if="showProgress && progress !== null" class="progress-container">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: progress + '%' }"
          ></div>
        </div>
        <div class="progress-text">{{ progress }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps<{
  type?: 'default' | 'dots' | 'pulse' | 'wave' | 'file';
  text?: string;
  isOverlay?: boolean;
  showProgress?: boolean;
  progress?: number | null;
  typewriterEffect?: boolean;
}>();
</script>

<style scoped>
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.loading-container.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  z-index: 9999;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

/* 默认加载动画 */
.spinner-default {
  position: relative;
  width: 60px;
  height: 60px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}

.spinner-ring:nth-child(2) {
  width: 80%;
  height: 80%;
  top: 10%;
  left: 10%;
  border-top-color: #e74c3c;
  animation-duration: 1.5s;
  animation-direction: reverse;
}

.spinner-ring:nth-child(3) {
  width: 60%;
  height: 60%;
  top: 20%;
  left: 20%;
  border-top-color: #f39c12;
  animation-duration: 1.8s;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 点状加载动画 */
.spinner-dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 12px;
  height: 12px;
  background: #3498db;
  border-radius: 50%;
  animation: dot-bounce 1.4s ease-in-out infinite both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes dot-bounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 脉冲加载动画 */
.spinner-pulse {
  position: relative;
  width: 60px;
  height: 60px;
}

.pulse-circle {
  width: 100%;
  height: 100%;
  background: #3498db;
  border-radius: 50%;
  animation: pulse-scale 1.5s ease-in-out infinite;
}

.pulse-circle::before,
.pulse-circle::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: inherit;
  border-radius: inherit;
  animation: pulse-scale 1.5s ease-in-out infinite;
}

.pulse-circle::before {
  animation-delay: -0.5s;
}

.pulse-circle::after {
  animation-delay: -1s;
}

@keyframes pulse-scale {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

/* 波浪加载动画 */
.spinner-wave {
  display: flex;
  align-items: end;
  gap: 4px;
  height: 40px;
}

.wave-bar {
  width: 6px;
  background: #3498db;
  border-radius: 3px;
  animation: wave-bounce 1.2s ease-in-out infinite;
}

.wave-bar:nth-child(1) { animation-delay: 0s; }
.wave-bar:nth-child(2) { animation-delay: 0.1s; }
.wave-bar:nth-child(3) { animation-delay: 0.2s; }
.wave-bar:nth-child(4) { animation-delay: 0.3s; }
.wave-bar:nth-child(5) { animation-delay: 0.4s; }

@keyframes wave-bounce {
  0%, 40%, 100% {
    height: 10px;
  }
  20% {
    height: 40px;
  }
}

/* 文件处理动画 */
.spinner-file {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.file-icon {
  font-size: 48px;
  animation: file-bounce 2s ease-in-out infinite;
}

@keyframes file-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.processing-dots {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 16px;
  color: #7f8c8d;
}

.dot-1, .dot-2, .dot-3 {
  animation: dot-fade 1.5s ease-in-out infinite;
}

.dot-1 { animation-delay: 0s; }
.dot-2 { animation-delay: 0.5s; }
.dot-3 { animation-delay: 1s; }

@keyframes dot-fade {
  0%, 66% { opacity: 0; }
  33% { opacity: 1; }
}

/* 加载文本 */
.loading-text {
  font-size: 16px;
  color: #2c3e50;
  font-weight: 500;
  text-align: center;
  max-width: 300px;
}

.loading-text.typewriter {
  overflow: hidden;
  border-right: 2px solid #3498db;
  white-space: nowrap;
  animation: typing 2s steps(20, end) infinite, blink-caret 0.75s step-end infinite;
}

@keyframes typing {
  0% { width: 0; }
  50% { width: 100%; }
  100% { width: 0; }
}

@keyframes blink-caret {
  from, to { border-color: transparent; }
  50% { border-color: #3498db; }
}

/* 进度条 */
.progress-container {
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2980b9);
  border-radius: 4px;
  transition: width 0.3s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: progress-shine 2s infinite;
}

@keyframes progress-shine {
  0% { left: -100%; }
  100% { left: 100%; }
}

.progress-text {
  text-align: center;
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .loading-container.overlay {
    padding: 20px;
  }
  
  .spinner-default {
    width: 40px;
    height: 40px;
  }
  
  .file-icon {
    font-size: 36px;
  }
  
  .progress-container {
    width: 150px;
  }
}
</style>
