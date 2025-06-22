<template>
  <div class="preview-container" v-if="previewData">
    <div class="preview-header">
      <h3>LLM文件整理预览</h3>
      <div class="preview-stats">
        <div class="stat-item">
          <span class="stat-label">总文件数:</span>
          <span class="stat-value">{{ previewData.totalFiles }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">分类数:</span>
          <span class="stat-value">{{ Object.keys(previewData.categorySummary).filter(key => previewData.categorySummary[key] > 0).length }}</span>
        </div>
        <div class="stat-item" v-if="previewData.outputDirectoryPath && previewData.outputDirectoryPath !== sourceDirectoryPath">
          <span class="stat-label">输出目录:</span>
          <span class="stat-value output-path">{{ getRelativePath(previewData.outputDirectoryPath) }}</span>
        </div>
      </div>
    </div>

    <div class="preview-content">
      <!-- 分类统计概览 -->
      <div class="category-summary">
        <h4>分类统计</h4>
        <div class="category-cards">
          <div 
            v-for="[category, count] in Object.entries(previewData.categorySummary).filter(([, count]) => count > 0)"
            :key="category"
            class="category-card"
            :class="{ 'unclassified': category === unclassifiedFolderName }"
          >
            <div class="category-name">{{ category }}</div>
            <div class="category-count">{{ count }} 个文件</div>
            <div class="category-percentage">
              {{ Math.round((count / previewData.totalFiles) * 100) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- 树状结构预览 -->
      <div class="structure-preview">
        <h4>目录结构预览</h4>
        <div class="structure-comparison">
          <!-- 整理前结构 -->
          <div class="structure-before">
            <h5>整理前</h5>
            <div class="tree-container">
              <div class="tree-node root">
                <div class="node-content">
                  <i class="folder-icon">📁</i>
                  <span class="node-name">{{ getDirectoryName(sourceDirectoryPath) }}</span>
                </div>
                <div class="tree-children">
                  <!-- 根目录下的文件 -->
                  <div 
                    v-for="file in beforeStructure.rootFiles"
                    :key="file.fileName"
                    class="tree-node file"
                  >
                    <div class="node-content">
                      <i class="file-icon">📄</i>
                      <span class="node-name">{{ file.fileName }}</span>
                    </div>
                  </div>
                  
                  <!-- 子目录及其文件 -->
                  <div 
                    v-for="node in beforeStructure.directories" 
                    :key="node.path"
                    class="tree-node"
                  >
                    <div class="node-content">
                      <i class="folder-icon">📁</i>
                      <span class="node-name">{{ node.name }}</span>
                    </div>
                    <div v-if="node.files.length > 0" class="tree-children">
                      <div 
                        v-for="file in node.files"
                        :key="file.fileName"
                        class="tree-node file"
                      >
                        <div class="node-content">
                          <i class="file-icon">📄</i>
                          <span class="node-name">{{ file.fileName }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 箭头 -->
          <div class="arrow-container">
            <div class="transform-arrow">→</div>
            <div class="transform-text">整理后</div>
          </div>

          <!-- 整理后结构 -->
          <div class="structure-after">
            <h5>整理后</h5>
            <div class="tree-container">
              <div class="tree-node root">
                <div class="node-content">
                  <i class="folder-icon">📁</i>
                  <span class="node-name">{{ getDirectoryName(previewData.outputDirectoryPath || sourceDirectoryPath) }}</span>
                </div>
                <div class="tree-children">
                  <div 
                    v-for="[category, files] in Object.entries(afterStructure).filter(([, files]) => files.length > 0)"
                    :key="category"
                    class="tree-node"
                  >
                    <div class="node-content">
                      <i class="folder-icon">📁</i>
                      <span class="node-name">{{ category }}</span>
                      <span class="file-count">({{ files.length }})</span>
                    </div>
                    <div class="tree-children">
                      <div 
                        v-for="file in files"
                        :key="file.fileName"
                        class="tree-node file"
                      >
                        <div class="node-content">
                          <i class="file-icon">📄</i>
                          <span class="node-name">{{ file.fileName }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 详细文件列表 -->
      <div class="file-details">
        <h4>详细分类结果</h4>
        <div class="category-sections">
          <div 
            v-for="[category, count] in Object.entries(previewData.categorySummary).filter(([, count]) => count > 0)"
            :key="category"
            class="category-section"
          >
            <div class="category-header" @click="toggleCategory(category)">
              <div class="category-title">
                <i class="icon" :class="expandedCategories.has(category) ? 'icon-expanded' : 'icon-collapsed'"></i>
                <span class="category-name">{{ category }}</span>
                <span class="file-count">({{ count }} 个文件)</span>
              </div>
            </div>
            
            <div v-if="expandedCategories.has(category)" class="file-list">
              <div 
                v-for="file in getFilesForCategory(category)"
                :key="file.filePath"
                class="file-item"
              >
                <div class="file-info">
                  <div class="file-name">{{ file.fileName }}</div>
                  <div class="file-path">{{ file.relativePath }}</div>
                </div>
                <div class="file-target">
                  <span class="arrow">→</span>
                  <span class="target-path">{{ getRelativeTargetPath(file.targetPath) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="preview-actions">
      <button class="btn btn-secondary" @click="$emit('cancel')">
        取消
      </button>
      <button class="btn btn-primary" @click="$emit('confirm')">
        确认执行整理
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface FileClassificationItem {
  filePath: string;
  fileName: string;
  relativePath: string;
  assignedCategory: string;
  targetPath: string;
}

interface PreviewData {
  success: boolean;
  message?: string;
  classifications: FileClassificationItem[];
  categorySummary: { [category: string]: number };
  totalFiles: number;
  outputDirectoryPath?: string;
}

const props = defineProps<{
  previewData: PreviewData | null;
  sourceDirectoryPath: string;
  unclassifiedFolderName: string;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

// 展开的分类
const expandedCategories = ref<Set<string>>(new Set());

// 切换分类展开状态
const toggleCategory = (category: string) => {
  if (expandedCategories.value.has(category)) {
    expandedCategories.value.delete(category);
  } else {
    expandedCategories.value.add(category);
  }
};

// 获取指定分类的文件列表
const getFilesForCategory = (category: string) => {
  if (!props.previewData) return [];
  return props.previewData.classifications.filter(file => file.assignedCategory === category);
};

// 获取相对目标路径
const getRelativeTargetPath = (targetPath: string) => {
  const basePath = props.previewData?.outputDirectoryPath || props.sourceDirectoryPath;
  if (!basePath) return targetPath;
  const relativePath = targetPath.replace(basePath, '');
  return relativePath.startsWith('/') || relativePath.startsWith('\\') 
    ? relativePath.substring(1) 
    : relativePath;
};

// 获取相对路径
const getRelativePath = (fullPath: string) => {
  if (!fullPath) return '';
  const parts = fullPath.split(/[/\\]/);
  return parts.slice(-2).join('/'); // 显示最后两级目录
};

// 获取目录名称
const getDirectoryName = (path: string) => {
  if (!path) return '';
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || parts[parts.length - 2] || '根目录';
};

// 计算整理前的目录结构
const beforeStructure = computed(() => {
  if (!props.previewData) return { directories: [], rootFiles: [] };
  
  const structure: { [key: string]: { name: string; path: string; files: FileClassificationItem[] } } = {};
  const rootFiles: FileClassificationItem[] = [];
  
  props.previewData.classifications.forEach((file) => {
    const pathParts = file.relativePath.split(/[/\\]/);
    if (pathParts.length > 1) {
      // 文件在子目录中
      const dirPath = pathParts.slice(0, -1).join("/");
      const dirName = pathParts[0]; // 使用第一级目录名
      
      if (!structure[dirPath]) {
        structure[dirPath] = {
          name: dirName,
          path: dirPath,
          files: [],
        };
      }
      structure[dirPath].files.push(file);
    } else {
      // 文件直接在根目录中
      rootFiles.push(file);
    }
  });
  
  return {
    directories: Object.values(structure),
    rootFiles: rootFiles,
  };
});

// 计算整理后的目录结构
const afterStructure = computed(() => {
  if (!props.previewData) return {};
  
  const structure: { [category: string]: FileClassificationItem[] } = {};
  
  props.previewData.classifications.forEach(file => {
    const category = file.assignedCategory;
    if (!structure[category]) {
      structure[category] = [];
    }
    structure[category].push(file);
  });
  
  return structure;
});

// 默认展开第一个分类
if (props.previewData) {
  const firstCategory = Object.entries(
    props.previewData.categorySummary
  ).filter(([, count]) => count > 0)[0]?.[0];
  if (firstCategory) {
    expandedCategories.value.add(firstCategory);
  }
}
</script>

<style scoped>
/* 使用与快速分类预览相同的样式 */
.preview-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.preview-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
}

.preview-header h3 {
  margin: 0 0 15px 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.preview-stats {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.output-path {
  font-size: 1rem !important;
  font-weight: 500 !important;
}

.preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.category-summary {
  margin-bottom: 30px;
}

.category-summary h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.2rem;
}

.category-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.category-card {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  transition: all 0.2s ease;
}

.category-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
}

.category-card.unclassified {
  background: #fff3cd;
  border-color: #ffeaa7;
}

.category-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.category-count {
  font-size: 1.1rem;
  color: #667eea;
  font-weight: 600;
  margin-bottom: 4px;
}

.category-percentage {
  font-size: 0.9rem;
  color: #6c757d;
}

/* 树状结构预览样式 */
.structure-preview {
  margin-bottom: 30px;
}

.structure-preview h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.2rem;
}

.structure-comparison {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 20px;
  align-items: start;
}

.structure-before,
.structure-after {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e9ecef;
}

.structure-before h5,
.structure-after h5 {
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 1rem;
  text-align: center;
}

.arrow-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 20px 0;
}

.transform-arrow {
  font-size: 2rem;
  color: #667eea;
  font-weight: bold;
}

.transform-text {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 500;
}

.tree-container {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.4;
}

.tree-node {
  margin: 2px 0;
}

.tree-node.root > .node-content {
  font-weight: 600;
  color: #495057;
}

.tree-node.file > .node-content {
  color: #6c757d;
  font-size: 0.85rem;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
}

.folder-icon,
.file-icon {
  font-size: 0.9rem;
  flex-shrink: 0;
}

.node-name {
  flex: 1;
  word-break: break-all;
}

.tree-children {
  margin-left: 20px;
  border-left: 1px solid #dee2e6;
  padding-left: 10px;
}

.tree-children .tree-children {
  margin-left: 15px;
}

.file-details h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.2rem;
}

.category-section {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 15px;
  overflow: hidden;
}

.category-header {
  background: #f8f9fa;
  padding: 15px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.category-header:hover {
  background: #e9ecef;
}

.category-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon {
  width: 0;
  height: 0;
  transition: transform 0.2s ease;
}

.icon-collapsed {
  border-left: 6px solid #667eea;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
}

.icon-expanded {
  border-top: 6px solid #667eea;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  transform: rotate(0deg);
}

.file-count {
  color: #6c757d;
  font-size: 0.9rem;
}

.file-list {
  max-height: 300px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  border-top: 1px solid #e9ecef;
  transition: background-color 0.2s ease;
}

.file-item:hover {
  background: #f8f9fa;
}

.file-info {
  flex: 1;
}

.file-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.file-path {
  font-size: 0.85rem;
  color: #6c757d;
}

.file-target {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #667eea;
}

.arrow {
  color: #6c757d;
}

.target-path {
  font-weight: 500;
}

.preview-actions {
  background: #f8f9fa;
  padding: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a67d8;
}

/* 滚动条样式 */
.preview-content::-webkit-scrollbar,
.file-list::-webkit-scrollbar {
  width: 6px;
}

.preview-content::-webkit-scrollbar-track,
.file-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.preview-content::-webkit-scrollbar-thumb,
.file-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.preview-content::-webkit-scrollbar-thumb:hover,
.file-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
