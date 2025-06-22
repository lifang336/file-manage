<template>
  <div class="modern-sidebar" :class="{ collapsed: isCollapsed }">
    <!-- 顶部Logo和折叠按钮 -->
    <div class="sidebar-header">
      <div class="logo-section" v-if="!isCollapsed">
        <div class="logo-icon">📁</div>
        <h2 class="app-title">智能文件管理器</h2>
      </div>
      <div class="logo-section" v-else>
        <div class="logo-icon">📁</div>
      </div>
      <button class="collapse-btn" @click="toggleCollapse">
        <span class="collapse-icon" :class="{ rotated: isCollapsed }">‹</span>
      </button>
    </div>

    <!-- 导航菜单 -->
    <nav class="sidebar-nav">
      <div class="nav-section">
        <div class="nav-section-title" v-if="!isCollapsed">主要功能</div>
        <ul class="nav-list">
          <li
            v-for="item in mainNavItems"
            :key="item.id"
            class="nav-item"
            :class="{ active: currentView === item.id }"
            @click="$emit('navigate', item.id)"
          >
            <div class="nav-link">
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-text" v-if="!isCollapsed">{{ item.label }}</span>
            </div>
          </li>
        </ul>
      </div>

      <div class="nav-section">
        <div class="nav-section-title" v-if="!isCollapsed">工具</div>
        <ul class="nav-list">
          <li
            v-for="item in toolNavItems"
            :key="item.id"
            class="nav-item"
            :class="{ active: currentView === item.id }"
            @click="$emit('navigate', item.id)"
          >
            <div class="nav-link">
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-text" v-if="!isCollapsed">{{ item.label }}</span>
            </div>
          </li>
        </ul>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from "vue";

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

const props = defineProps<{
  currentView: string;
}>();

const emit = defineEmits<{
  (e: "navigate", viewId: string): void;
}>();

const isCollapsed = ref(false);

const mainNavItems: NavItem[] = [
  { id: "manual", label: "规则分类", icon: "📋" },
  { id: "ai", label: "AI智能分类", icon: "🤖" },
];

const toolNavItems: NavItem[] = [{ id: "settings", label: "设置", icon: "⚙️" }];

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};
</script>

<style scoped>
.modern-sidebar {
  width: 280px;
  height: 100vh;
  background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
  color: #ecf0f1;
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 100;
}

.modern-sidebar.collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 80px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
}

.collapse-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #ecf0f1;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.collapse-icon {
  font-size: 18px;
  font-weight: bold;
  transition: transform 0.3s ease;
}

.collapse-icon.rotated {
  transform: rotate(180deg);
}

.sidebar-nav {
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
}

.nav-section {
  margin-bottom: 30px;
}

.nav-section-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #bdc3c7;
  margin-bottom: 15px;
  padding: 0 20px;
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-item {
  margin-bottom: 4px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 20px;
  color: #ecf0f1;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 0 25px 25px 0;
  margin-right: 20px;
}

.nav-item:hover .nav-link {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(5px);
}

.nav-item.active .nav-link {
  background: linear-gradient(90deg, #3498db, #2980b9);
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.nav-icon {
  font-size: 20px;
  width: 24px;
  text-align: center;
}

.nav-text {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

/* 滚动条样式 */
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
