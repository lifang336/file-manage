import * as fs from "fs";
import * as path from "path";
import { app } from "electron";

// 配置文件接口
export interface AppConfig {
  // 目录配置
  sourceDirectory?: string;
  outputDirectory?: string;
  unclassifiedFolderName: string;
  recursive: boolean;

  // LLM配置
  llmConfig: {
    baseUrl: string;
    apiKey: string;
    model: string;
  };

  // 手动分类规则
  classificationRules: Array<{
    categoryName: string;
    matchType: "extension" | "keyword";
    matchValue: string;
  }>;

  // 其他设置
  shouldSaveDirectoryStructureLog: boolean;
}

// 默认配置
const defaultConfig: AppConfig = {
  unclassifiedFolderName: "未分类文件",
  recursive: true,
  llmConfig: {
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    apiKey: "",
    model: "qwen-plus-latest",
  },
  classificationRules: [],
  shouldSaveDirectoryStructureLog: true,
};

// 获取配置文件路径
function getConfigPath(): string {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "config.json");
}

// 读取配置
export function loadConfig(): AppConfig {
  const configPath = getConfigPath();
  
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, "utf-8");
      const config = JSON.parse(configData);
      
      // 合并默认配置，确保新增的配置项有默认值
      return { ...defaultConfig, ...config };
    }
  } catch (error) {
    console.error("[ConfigService] 读取配置文件失败:", error);
  }
  
  // 如果文件不存在或读取失败，返回默认配置
  return { ...defaultConfig };
}

// 保存配置
export function saveConfig(config: AppConfig): boolean {
  const configPath = getConfigPath();
  
  try {
    // 确保目录存在
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // 保存配置
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
    console.log("[ConfigService] 配置已保存到:", configPath);
    return true;
  } catch (error) {
    console.error("[ConfigService] 保存配置文件失败:", error);
    return false;
  }
}

// 更新配置的部分字段
export function updateConfig(updates: Partial<AppConfig>): boolean {
  const currentConfig = loadConfig();
  const newConfig = { ...currentConfig, ...updates };
  
  // 特殊处理嵌套对象
  if (updates.llmConfig) {
    newConfig.llmConfig = { ...currentConfig.llmConfig, ...updates.llmConfig };
  }
  
  return saveConfig(newConfig);
}

// 重置配置为默认值
export function resetConfig(): boolean {
  return saveConfig({ ...defaultConfig });
}

// 获取配置文件路径（用于调试）
export function getConfigFilePath(): string {
  return getConfigPath();
}
