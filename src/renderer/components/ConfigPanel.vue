<template>
  <div class="config-panel">
    <div class="panel-header">
      <h2>配置中心</h2>
      <p>设置文件整理的基本参数和选项</p>
    </div>

    <div class="config-grid">
      <!-- 目录配置卡片 -->
      <div class="config-card directory-card">
        <div class="card-header">
          <div class="card-icon">📁</div>
          <div class="card-title">
            <h3>目录设置</h3>
            <p>选择源文件和输出目录</p>
          </div>
        </div>

        <div class="card-content">
          <!-- 源目录 -->
          <div class="directory-section">
            <label class="section-label">
              <span class="label-icon">📂</span>
              源文件目录
              <span class="required">*</span>
            </label>
            <div 
              class="directory-selector"
              :class="{ 'has-value': sourceDirectory, 'drag-over': isDragOverSource }"
              @click="selectSourceDirectory"
              @dragover.prevent="handleDragOver('source')"
              @dragleave.prevent="handleDragLeave('source')"
              @drop.prevent="handleDrop('source', $event)"
            >
              <div v-if="sourceDirectory" class="selected-directory">
                <span class="directory-icon">📁</span>
                <div class="directory-info">
                  <div class="directory-path">{{ sourceDirectory }}</div>
                  <div class="directory-meta">{{ sourceDirectoryMeta }}</div>
                </div>
                <button class="change-btn" @click.stop="selectSourceDirectory">
                  更改
                </button>
              </div>
              <div v-else class="empty-directory">
                <span class="empty-icon">📁</span>
                <div class="empty-text">
                  <div class="empty-title">选择源文件目录</div>
                  <div class="empty-subtitle">点击选择或拖拽文件夹到此处</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 输出目录 -->
          <div class="directory-section">
            <label class="section-label">
              <span class="label-icon">📤</span>
              输出目录
              <span class="optional">(可选)</span>
            </label>
            <div 
              class="directory-selector optional"
              :class="{ 'has-value': outputDirectory, 'drag-over': isDragOverOutput }"
              @click="selectOutputDirectory"
              @dragover.prevent="handleDragOver('output')"
              @dragleave.prevent="handleDragLeave('output')"
              @drop.prevent="handleDrop('output', $event)"
            >
              <div v-if="outputDirectory" class="selected-directory">
                <span class="directory-icon">📁</span>
                <div class="directory-info">
                  <div class="directory-path">{{ outputDirectory }}</div>
                  <div class="directory-meta">{{ outputDirectoryMeta }}</div>
                </div>
                <button class="change-btn" @click.stop="selectOutputDirectory">
                  更改
                </button>
                <button class="clear-btn" @click.stop="clearOutputDirectory">
                  清除
                </button>
              </div>
              <div v-else class="empty-directory">
                <span class="empty-icon">📤</span>
                <div class="empty-text">
                  <div class="empty-title">选择输出目录</div>
                  <div class="empty-subtitle">不选择则在源目录内创建分类文件夹</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 通用选项卡片 -->
      <div class="config-card options-card">
        <div class="card-header">
          <div class="card-icon">⚙️</div>
          <div class="card-title">
            <h3>通用选项</h3>
            <p>配置文件整理的基本选项</p>
          </div>
        </div>

        <div class="card-content">
          <div class="option-group">
            <label class="option-label">
              <span class="label-icon">📁</span>
              未分类文件夹名称
            </label>
            <input 
              type="text" 
              v-model="unclassifiedFolderName"
              class="option-input"
              placeholder="未分类文件"
            />
          </div>

          <div class="option-group">
            <label class="toggle-option">
              <input 
                type="checkbox" 
                v-model="recursive"
                class="toggle-input"
              />
              <span class="toggle-slider"></span>
              <div class="toggle-content">
                <span class="toggle-title">递归处理子文件夹</span>
                <span class="toggle-description">同时整理源目录下的所有子文件夹</span>
              </div>
            </label>
          </div>

          <div class="option-group">
            <label class="toggle-option">
              <input 
                type="checkbox" 
                v-model="createBackup"
                class="toggle-input"
              />
              <span class="toggle-slider"></span>
              <div class="toggle-content">
                <span class="toggle-title">创建备份</span>
                <span class="toggle-description">在整理前创建目录结构备份</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- 快速预设卡片 -->
      <div class="config-card presets-card">
        <div class="card-header">
          <div class="card-icon">⚡</div>
          <div class="card-title">
            <h3>快速预设</h3>
            <p>使用预定义的配置模板</p>
          </div>
        </div>

        <div class="card-content">
          <div class="preset-list">
            <div 
              v-for="preset in presets" 
              :key="preset.id"
              class="preset-item"
              @click="applyPreset(preset)"
            >
              <div class="preset-icon">{{ preset.icon }}</div>
              <div class="preset-info">
                <div class="preset-name">{{ preset.name }}</div>
                <div class="preset-description">{{ preset.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="panel-actions">
      <button class="action-btn secondary" @click="resetConfig">
        <span class="btn-icon">🔄</span>
        重置配置
      </button>
      <button class="action-btn primary" @click="saveConfig" :disabled="!isConfigValid">
        <span class="btn-icon">💾</span>
        保存配置
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from 'vue';

const props = defineProps<{
  sourceDirectory?: string;
  outputDirectory?: string;
  unclassifiedFolderName?: string;
  recursive?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:sourceDirectory', value: string): void;
  (e: 'update:outputDirectory', value: string): void;
  (e: 'update:unclassifiedFolderName', value: string): void;
  (e: 'update:recursive', value: boolean): void;
  (e: 'config-saved', config: any): void;
}>();

// 本地状态
const sourceDirectory = ref(props.sourceDirectory || '');
const outputDirectory = ref(props.outputDirectory || '');
const unclassifiedFolderName = ref(props.unclassifiedFolderName || '未分类文件');
const recursive = ref(props.recursive ?? true);
const createBackup = ref(true);

// 拖拽状态
const isDragOverSource = ref(false);
const isDragOverOutput = ref(false);

// 计算属性
const sourceDirectoryMeta = computed(() => {
  if (!sourceDirectory.value) return '';
  return '点击更改目录';
});

const outputDirectoryMeta = computed(() => {
  if (!outputDirectory.value) return '';
  return '点击更改目录';
});

const isConfigValid = computed(() => {
  return sourceDirectory.value.trim() !== '';
});

// 预设配置
const presets = [
  {
    id: 'documents',
    name: '文档整理',
    icon: '📄',
    description: '适合整理办公文档和资料',
    config: {
      unclassifiedFolderName: '其他文档',
      recursive: true,
      createBackup: true
    }
  },
  {
    id: 'media',
    name: '媒体文件',
    icon: '🎬',
    description: '适合整理图片、视频等媒体文件',
    config: {
      unclassifiedFolderName: '其他媒体',
      recursive: false,
      createBackup: false
    }
  },
  {
    id: 'downloads',
    name: '下载文件',
    icon: '⬇️',
    description: '适合整理下载文件夹',
    config: {
      unclassifiedFolderName: '未分类下载',
      recursive: false,
      createBackup: true
    }
  }
];

// 方法
const selectSourceDirectory = async () => {
  try {
    // @ts-ignore
    const paths = await window.electronAPI.selectDirectory();
    if (paths && paths.length > 0) {
      sourceDirectory.value = paths;
      emit('update:sourceDirectory', paths);
    }
  } catch (error) {
    console.error('选择源目录失败:', error);
  }
};

const selectOutputDirectory = async () => {
  try {
    // @ts-ignore
    const paths = await window.electronAPI.selectDirectory();
    if (paths && paths.length > 0) {
      outputDirectory.value = paths;
      emit('update:outputDirectory', paths);
    }
  } catch (error) {
    console.error('选择输出目录失败:', error);
  }
};

const clearOutputDirectory = () => {
  outputDirectory.value = '';
  emit('update:outputDirectory', '');
};

const handleDragOver = (type: 'source' | 'output') => {
  if (type === 'source') {
    isDragOverSource.value = true;
  } else {
    isDragOverOutput.value = true;
  }
};

const handleDragLeave = (type: 'source' | 'output') => {
  if (type === 'source') {
    isDragOverSource.value = false;
  } else {
    isDragOverOutput.value = false;
  }
};

const handleDrop = (type: 'source' | 'output', event: DragEvent) => {
  if (type === 'source') {
    isDragOverSource.value = false;
  } else {
    isDragOverOutput.value = false;
  }
  
  // 处理拖拽的文件夹
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files[0];
    // 注意：在Electron中，拖拽文件夹的处理可能需要特殊处理
    console.log('拖拽文件:', file);
  }
};

const applyPreset = (preset: any) => {
  unclassifiedFolderName.value = preset.config.unclassifiedFolderName;
  recursive.value = preset.config.recursive;
  createBackup.value = preset.config.createBackup;
  
  emit('update:unclassifiedFolderName', unclassifiedFolderName.value);
  emit('update:recursive', recursive.value);
};

const resetConfig = () => {
  sourceDirectory.value = '';
  outputDirectory.value = '';
  unclassifiedFolderName.value = '未分类文件';
  recursive.value = true;
  createBackup.value = true;
  
  emit('update:sourceDirectory', '');
  emit('update:outputDirectory', '');
  emit('update:unclassifiedFolderName', '未分类文件');
  emit('update:recursive', true);
};

const saveConfig = () => {
  const config = {
    sourceDirectory: sourceDirectory.value,
    outputDirectory: outputDirectory.value,
    unclassifiedFolderName: unclassifiedFolderName.value,
    recursive: recursive.value,
    createBackup: createBackup.value
  };
  
  emit('config-saved', config);
};
</script>

<style scoped>
.config-panel {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.panel-header {
  text-align: center;
  margin-bottom: 40px;
}

.panel-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 10px;
}

.panel-header p {
  color: #7f8c8d;
  font-size: 16px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.config-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.config-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.card-icon {
  font-size: 32px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
}

.card-title h3 {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.card-title p {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
}

.directory-section {
  margin-bottom: 24px;
}

.directory-section:last-child {
  margin-bottom: 0;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 12px;
}

.label-icon {
  font-size: 16px;
}

.required {
  color: #e74c3c;
  font-size: 12px;
}

.optional {
  color: #95a5a6;
  font-size: 12px;
}

.directory-selector {
  border: 2px dashed #ddd;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 80px;
  display: flex;
  align-items: center;
}

.directory-selector:hover {
  border-color: #3498db;
  background: #f8f9fa;
}

.directory-selector.has-value {
  border-style: solid;
  border-color: #27ae60;
  background: #f8fff8;
}

.directory-selector.drag-over {
  border-color: #3498db;
  background: #e3f2fd;
}

.selected-directory {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.directory-icon {
  font-size: 24px;
}

.directory-info {
  flex: 1;
}

.directory-path {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  word-break: break-all;
}

.directory-meta {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 2px;
}

.change-btn,
.clear-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.change-btn {
  background: #3498db;
  color: white;
  margin-right: 8px;
}

.change-btn:hover {
  background: #2980b9;
}

.clear-btn {
  background: #e74c3c;
  color: white;
}

.clear-btn:hover {
  background: #c0392b;
}

.empty-directory {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  opacity: 0.7;
}

.empty-icon {
  font-size: 32px;
}

.empty-title {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
}

.empty-subtitle {
  font-size: 12px;
  color: #7f8c8d;
}

.option-group {
  margin-bottom: 20px;
}

.option-group:last-child {
  margin-bottom: 0;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 8px;
}

.option-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.option-input:focus {
  outline: none;
  border-color: #3498db;
}

.toggle-option {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.toggle-input {
  display: none;
}

.toggle-slider {
  width: 44px;
  height: 24px;
  background: #ddd;
  border-radius: 12px;
  position: relative;
  transition: background 0.2s ease;
}

.toggle-slider::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s ease;
}

.toggle-input:checked + .toggle-slider {
  background: #3498db;
}

.toggle-input:checked + .toggle-slider::after {
  transform: translateX(20px);
}

.toggle-content {
  flex: 1;
}

.toggle-title {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  display: block;
}

.toggle-description {
  font-size: 12px;
  color: #7f8c8d;
  display: block;
  margin-top: 2px;
}

.preset-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preset-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-item:hover {
  border-color: #3498db;
  background: #f8f9fa;
}

.preset-icon {
  font-size: 24px;
  width: 40px;
  text-align: center;
}

.preset-info {
  flex: 1;
}

.preset-name {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
}

.preset-description {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 2px;
}

.panel-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.secondary {
  background: #95a5a6;
  color: white;
}

.action-btn.secondary:hover {
  background: #7f8c8d;
}

.action-btn.primary {
  background: #3498db;
  color: white;
}

.action-btn.primary:hover:not(:disabled) {
  background: #2980b9;
}

.action-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 16px;
}
</style>
