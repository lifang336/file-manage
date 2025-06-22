<template>
  <div class="workflow-view">
    <!-- 进度指示器 -->
    <div class="progress-header">
      <h1 class="workflow-title">文件整理工作流程</h1>
      <div class="progress-indicator">
        <div
          v-for="(step, index) in steps"
          :key="step.id"
          class="progress-step"
          :class="{
            active: currentStep === index,
            completed: index < currentStep,
            disabled: index > currentStep,
          }"
          @click="goToStep(index)"
        >
          <div class="step-number">{{ index + 1 }}</div>
          <div class="step-label">{{ step.title }}</div>
        </div>
      </div>
    </div>

    <!-- 步骤内容 -->
    <div class="step-content">
      <!-- 步骤1: 选择目录 -->
      <div v-if="currentStep === 0" class="step-panel">
        <div class="step-header">
          <h2>📁 选择要整理的目录</h2>
          <p>首先选择需要整理的源文件目录和输出目录</p>
        </div>

        <div class="directory-cards">
          <div class="directory-card">
            <div class="card-header">
              <span class="card-icon">📂</span>
              <h3>源文件目录</h3>
            </div>
            <div class="card-content">
              <div class="directory-display" v-if="sourceDirectory">
                <span class="directory-path">{{ sourceDirectory }}</span>
                <button class="change-btn" @click="selectSourceDirectory">
                  更改
                </button>
              </div>
              <div class="directory-placeholder" v-else>
                <button class="select-btn" @click="selectSourceDirectory">
                  <span class="btn-icon">📁</span>
                  选择源目录
                </button>
              </div>
            </div>
          </div>

          <div class="directory-card">
            <div class="card-header">
              <span class="card-icon">📤</span>
              <h3>输出目录 (可选)</h3>
            </div>
            <div class="card-content">
              <div class="directory-display" v-if="outputDirectory">
                <span class="directory-path">{{ outputDirectory }}</span>
                <button class="change-btn" @click="selectOutputDirectory">
                  更改
                </button>
              </div>
              <div class="directory-placeholder" v-else>
                <button
                  class="select-btn secondary"
                  @click="selectOutputDirectory"
                >
                  <span class="btn-icon">📁</span>
                  选择输出目录
                </button>
                <p class="help-text">不选择则在源目录内创建分类文件夹</p>
              </div>
            </div>
          </div>
        </div>

        <div class="step-actions">
          <button
            class="next-btn"
            :disabled="!sourceDirectory"
            @click="nextStep"
          >
            下一步：选择整理方式
          </button>
        </div>
      </div>

      <!-- 步骤2: 选择整理方式 -->
      <div v-if="currentStep === 1" class="step-panel">
        <div class="step-header">
          <h2>⚡ 选择整理方式</h2>
          <p>选择最适合您需求的文件整理方式</p>
        </div>

        <div class="method-cards">
          <div
            class="method-card"
            :class="{ selected: selectedMethod === 'ai' }"
            @click="selectMethod('ai')"
          >
            <div class="method-icon">🤖</div>
            <h3>AI智能分类</h3>
            <p>让AI分析文件内容和名称，自动建议最佳分类方案</p>
            <div class="method-features">
              <span class="feature">✨ 智能分析</span>
              <span class="feature">🎯 精准分类</span>
              <span class="feature">⚡ 快速高效</span>
            </div>
          </div>

          <div
            class="method-card"
            :class="{ selected: selectedMethod === 'manual' }"
            @click="selectMethod('manual')"
          >
            <div class="method-icon">✋</div>
            <h3>手动规则分类</h3>
            <p>根据文件扩展名或关键词自定义分类规则</p>
            <div class="method-features">
              <span class="feature">🎛️ 完全控制</span>
              <span class="feature">📋 自定义规则</span>
              <span class="feature">🔄 可重复使用</span>
            </div>
          </div>
        </div>

        <div class="step-actions">
          <button class="back-btn" @click="prevStep">上一步</button>
          <button
            class="next-btn"
            :disabled="!selectedMethod"
            @click="nextStep"
          >
            下一步：配置参数
          </button>
        </div>
      </div>

      <!-- 步骤3: 配置参数 -->
      <div v-if="currentStep === 2" class="step-panel">
        <div class="step-header">
          <h2>⚙️ 配置整理参数</h2>
          <p>根据您的需求调整整理参数</p>
        </div>

        <div class="config-section">
          <div class="config-card">
            <h3>通用配置</h3>
            <div class="form-group">
              <label>未分类文件夹名称</label>
              <input
                type="text"
                v-model="config.unclassifiedFolder"
                placeholder="未分类文件"
              />
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="config.recursive" />
                <span class="checkmark"></span>
                递归处理子文件夹
              </label>
            </div>
          </div>

          <div class="config-card" v-if="selectedMethod === 'ai'">
            <h3>AI配置</h3>
            <div class="form-group">
              <label>分类焦点说明</label>
              <textarea
                v-model="config.classificationFocus"
                placeholder="例如：按文件类型分类，或按项目分类..."
              ></textarea>
            </div>
            <div class="form-group">
              <label>期望分类数量</label>
              <input
                type="number"
                v-model="config.numberOfCategories"
                min="3"
                max="20"
              />
            </div>
          </div>
        </div>

        <div class="step-actions">
          <button class="back-btn" @click="prevStep">上一步</button>
          <button class="next-btn" @click="nextStep">下一步：确认并执行</button>
        </div>
      </div>

      <!-- 步骤4: 确认并执行 -->
      <div v-if="currentStep === 3" class="step-panel">
        <div class="step-header">
          <h2>🚀 确认并执行</h2>
          <p>请确认以下配置，然后开始文件整理</p>
        </div>

        <div class="summary-card">
          <h3>整理配置摘要</h3>
          <div class="summary-item">
            <span class="label">源目录：</span>
            <span class="value">{{ sourceDirectory }}</span>
          </div>
          <div class="summary-item">
            <span class="label">输出目录：</span>
            <span class="value">{{ outputDirectory || "源目录内" }}</span>
          </div>
          <div class="summary-item">
            <span class="label">整理方式：</span>
            <span class="value">{{
              selectedMethod === "ai" ? "AI智能分类" : "手动规则分类"
            }}</span>
          </div>
          <div class="summary-item">
            <span class="label">递归处理：</span>
            <span class="value">{{ config.recursive ? "是" : "否" }}</span>
          </div>
        </div>

        <div class="execution-options">
          <div
            class="execution-card simulate-card"
            @click="executeWorkflow(true)"
          >
            <div class="execution-icon">🔍</div>
            <div class="execution-content">
              <h4>模拟运行</h4>
              <p>预览整理结果，不实际移动文件</p>
              <div class="execution-features">
                <span class="feature">✅ 安全预览</span>
                <span class="feature">📊 生成报告</span>
              </div>
            </div>
          </div>

          <div class="execution-card real-card" @click="executeWorkflow(false)">
            <div class="execution-icon">⚡</div>
            <div class="execution-content">
              <h4>立即执行</h4>
              <p>开始实际的文件整理操作</p>
              <div class="execution-features">
                <span class="feature">🚀 快速执行</span>
                <span class="feature">📁 实际整理</span>
              </div>
            </div>
          </div>
        </div>

        <div class="step-actions">
          <button class="back-btn" @click="prevStep">上一步</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, defineEmits } from "vue";

const emit = defineEmits<{
  (e: "navigate", viewId: string): void;
  (e: "execute-workflow", config: any): void;
}>();

const currentStep = ref(0);
const sourceDirectory = ref("");
const outputDirectory = ref("");
const selectedMethod = ref<"ai" | "manual" | null>(null);

const config = reactive({
  unclassifiedFolder: "未分类文件",
  recursive: true,
  classificationFocus: "",
  numberOfCategories: 10,
});

const steps = [
  { id: "directory", title: "选择目录" },
  { id: "method", title: "选择方式" },
  { id: "config", title: "配置参数" },
  { id: "execute", title: "执行整理" },
];

const nextStep = () => {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

const goToStep = (index: number) => {
  if (index <= currentStep.value || canGoToStep(index)) {
    currentStep.value = index;
  }
};

const canGoToStep = (index: number) => {
  // 检查是否可以跳转到指定步骤
  if (index === 0) return true;
  if (index === 1) return !!sourceDirectory.value;
  if (index === 2) return !!sourceDirectory.value && !!selectedMethod.value;
  if (index === 3) return !!sourceDirectory.value && !!selectedMethod.value;
  return false;
};

const selectSourceDirectory = async () => {
  try {
    // @ts-ignore
    const paths = await window.electronAPI.selectDirectory();
    if (paths && paths.length > 0) {
      sourceDirectory.value = paths;
    }
  } catch (error) {
    console.error("选择源目录失败:", error);
  }
};

const selectOutputDirectory = async () => {
  try {
    // @ts-ignore
    const paths = await window.electronAPI.selectDirectory();
    if (paths && paths.length > 0) {
      outputDirectory.value = paths;
    }
  } catch (error) {
    console.error("选择输出目录失败:", error);
  }
};

const selectMethod = (method: "ai" | "manual") => {
  selectedMethod.value = method;
};

const executeWorkflow = (isDryRun: boolean) => {
  const workflowConfig = {
    sourceDirectory: sourceDirectory.value,
    outputDirectory: outputDirectory.value,
    method: selectedMethod.value,
    isDryRun,
    ...config,
  };

  emit("execute-workflow", workflowConfig);

  // 导航到对应的执行页面
  if (selectedMethod.value === "ai") {
    emit("navigate", "ai");
  } else {
    emit("navigate", "manual");
  }
};
</script>

<style scoped>
.workflow-view {
  padding: 30px;
  max-width: 1000px;
  margin: 0 auto;
}

.progress-header {
  text-align: center;
  margin-bottom: 40px;
}

.workflow-title {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 30px;
}

.progress-indicator {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.progress-step.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  background: #ecf0f1;
  color: #7f8c8d;
  transition: all 0.2s ease;
}

.progress-step.active .step-number {
  background: #3498db;
  color: white;
}

.progress-step.completed .step-number {
  background: #27ae60;
  color: white;
}

.step-label {
  font-size: 12px;
  color: #7f8c8d;
  text-align: center;
}

.progress-step.active .step-label {
  color: #3498db;
  font-weight: 600;
}

.step-content {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.step-header {
  text-align: center;
  margin-bottom: 30px;
}

.step-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 10px;
}

.step-header p {
  color: #7f8c8d;
  font-size: 16px;
}

.directory-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.directory-card {
  border: 2px solid #ecf0f1;
  border-radius: 12px;
  padding: 20px;
  transition: border-color 0.2s ease;
}

.directory-card:hover {
  border-color: #3498db;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.card-icon {
  font-size: 24px;
}

.card-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.directory-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.directory-path {
  flex: 1;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  font-family: monospace;
  font-size: 14px;
  word-break: break-all;
}

.change-btn {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.select-btn {
  width: 100%;
  padding: 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background 0.2s ease;
}

.select-btn:hover {
  background: #2980b9;
}

.select-btn.secondary {
  background: #95a5a6;
}

.select-btn.secondary:hover {
  background: #7f8c8d;
}

.help-text {
  margin-top: 10px;
  font-size: 12px;
  color: #7f8c8d;
  text-align: center;
}

.method-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.method-card {
  border: 2px solid #ecf0f1;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.method-card:hover {
  border-color: #3498db;
  transform: translateY(-2px);
}

.method-card.selected {
  border-color: #3498db;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
}

.method-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.method-card h3 {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 10px;
}

.method-card p {
  color: #7f8c8d;
  margin-bottom: 16px;
}

.method-features {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.feature {
  padding: 4px 12px;
  background: #ecf0f1;
  border-radius: 20px;
  font-size: 12px;
  color: #2c3e50;
}

.config-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.config-card {
  border: 1px solid #ecf0f1;
  border-radius: 12px;
  padding: 20px;
}

.config-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #2c3e50;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.summary-card {
  border: 1px solid #ecf0f1;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 30px;
}

.summary-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f8f9fa;
}

.summary-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.label {
  font-weight: 500;
  color: #7f8c8d;
}

.value {
  color: #2c3e50;
  font-weight: 500;
}

.execution-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.execution-card {
  border: 2px solid #ecf0f1;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.execution-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s ease;
}

.execution-card:hover::before {
  left: 100%;
}

.execution-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.simulate-card {
  border-color: #f39c12;
  background: linear-gradient(135deg, #fff9e6, #fff);
}

.simulate-card:hover {
  border-color: #e67e22;
  background: linear-gradient(135deg, #fff3cd, #fff9e6);
}

.real-card {
  border-color: #27ae60;
  background: linear-gradient(135deg, #e8f5e8, #fff);
}

.real-card:hover {
  border-color: #229954;
  background: linear-gradient(135deg, #d4edda, #e8f5e8);
}

.execution-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.execution-content h4 {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.execution-content p {
  color: #7f8c8d;
  margin-bottom: 16px;
  font-size: 14px;
}

.execution-features {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.execution-features .feature {
  padding: 4px 12px;
  background: rgba(52, 152, 219, 0.1);
  border-radius: 20px;
  font-size: 12px;
  color: #3498db;
  font-weight: 500;
}

.step-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
}

.back-btn,
.next-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn {
  background: #95a5a6;
  color: white;
}

.back-btn:hover {
  background: #7f8c8d;
}

.next-btn {
  background: #3498db;
  color: white;
}

.next-btn:hover:not(:disabled) {
  background: #2980b9;
}

.next-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}
</style>
