<template>
  <div class="classification-preview">
    <div class="preview-header">
      <h3>分类预览结构</h3>
      <p class="preview-description">
        以下是根据您的分类规则生成的文件分类预览，请确认后执行整理操作。
      </p>
    </div>

    <div class="preview-content">
      <div v-if="isLoading" class="loading">
        <p>正在分析文件结构...</p>
      </div>

      <div v-else-if="previewData" class="preview-tree">
        <div class="tree-item root">
          <div class="folder-icon">📁</div>
          <span class="folder-name">{{ previewData.targetDirectory }}</span>
        </div>
        
        <div class="tree-children">
          <div 
            v-for="category in previewData.categories" 
            :key="category.name"
            class="tree-item category"
          >
            <div class="folder-icon">📂</div>
            <span class="folder-name">{{ category.name }}</span>
            <span class="file-count">({{ category.fileCount }} 个文件)</span>
            
            <div class="file-list" v-if="category.sampleFiles.length > 0">
              <div 
                v-for="file in category.sampleFiles" 
                :key="file"
                class="file-item"
              >
                <div class="file-icon">📄</div>
                <span class="file-name">{{ file }}</span>
              </div>
              <div v-if="category.fileCount > category.sampleFiles.length" class="more-files">
                ... 还有 {{ category.fileCount - category.sampleFiles.length }} 个文件
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="no-preview">
        <p>暂无预览数据</p>
      </div>
    </div>

    <div class="preview-actions" v-if="previewData && !isLoading">
      <button @click="$emit('confirm-classification')" class="confirm-btn">
        确认并开始整理
      </button>
      <button @click="$emit('cancel-preview')" class="cancel-btn">
        取消
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

interface CategoryPreview {
  name: string;
  fileCount: number;
  sampleFiles: string[];
}

interface PreviewData {
  targetDirectory: string;
  categories: CategoryPreview[];
  totalFiles: number;
}

defineProps<{
  previewData: PreviewData | null;
  isLoading: boolean;
}>();

defineEmits<{
  (e: 'confirm-classification'): void;
  (e: 'cancel-preview'): void;
}>();
</script>

<style scoped>
.classification-preview {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
  padding: 20px;
  margin-bottom: 20px;
}

.preview-header h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-weight: 600;
}

.preview-description {
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.preview-tree {
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 15px;
  font-family: monospace;
}

.tree-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 5px;
}

.tree-item.root {
  font-weight: bold;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.tree-item.category {
  margin-left: 20px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #007bff;
}

.folder-icon, .file-icon {
  margin-right: 8px;
  font-size: 16px;
}

.folder-name {
  font-weight: 500;
  color: #333;
}

.file-count {
  margin-left: 10px;
  color: #666;
  font-size: 12px;
}

.file-list {
  margin-left: 40px;
  margin-top: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  padding: 2px 5px;
  font-size: 12px;
  color: #555;
}

.file-name {
  color: #666;
}

.more-files {
  color: #999;
  font-style: italic;
  font-size: 11px;
  margin-top: 5px;
}

.tree-children {
  margin-left: 0;
}

.no-preview {
  text-align: center;
  padding: 40px;
  color: #999;
}

.preview-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: center;
}

.confirm-btn {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.confirm-btn:hover {
  background-color: #218838;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.cancel-btn:hover {
  background-color: #5a6268;
}
</style>
