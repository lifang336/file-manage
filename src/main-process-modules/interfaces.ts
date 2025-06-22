// src/main-process-modules/interfaces.ts

/**
 * @interface ClassificationRule
 * @description 定义分类规则的结构，用于手动文件整理。
 */
export interface ClassificationRule {
  categoryName: string; // 分类名称
  matchType: "extension" | "keyword"; // 匹配类型：按扩展名或按文件名关键字
  matchValue: string; // 匹配值，例如 ".jpg" 或 "report" (多个值用逗号分隔)
}

/**
 * @interface ManualOrganizationOptions
 * @description 定义手动文件整理操作的选项。
 */
export interface ManualOrganizationOptions {
  sourceDirectoryPath: string; // 源目录路径
  outputDirectoryPath: string | null; // 输出目录路径，如果为 null 则在源目录内整理
  classificationRules: ClassificationRule[]; // 手动分类规则列表
  unclassifiedFolderName: string; // 未分类文件的存放文件夹名称
  recursive: boolean; // 是否递归处理子目录
  isDryRun?: boolean; // 是否为模拟运行，仅记录操作而不实际移动文件
}

/**
 * @interface LLMOrganizationOptions
 * @description 定义基于 LLM 的自动文件整理操作的选项。
 */
export interface LLMOrganizationOptions {
  sourceDirectoryPath: string; // 源目录路径
  outputDirectoryPath: string | null; // 输出目录路径，如果为 null 则在源目录内整理
  confirmedCategories: string[]; // 用户确认的用于 LLM 分类的文件夹名称列表
  apiKey: string; // 用于 LLM API 调用的密钥
  baseUrl?: string; // LLM API 基础URL (可选，如果不提供则使用配置中的默认值)
  model?: string; // 使用的模型名称 (可选，如果不提供则使用配置中的默认值)
  unclassifiedFolderName: string; // 未分类文件的存放文件夹名称
  recursive: boolean; // 是否递归处理子目录
  isDryRun: boolean; // 是否为模拟运行
}

/**
 * @interface LLMConfig
 * @description 定义LLM配置的结构。
 */
export interface LLMConfig {
  baseUrl: string; // LLM API 基础URL
  apiKey: string; // API 密钥
  model: string; // 使用的模型名称
}

/**
 * @interface LLMCategoryOptions
 * @description 定义请求 LLM 分类建议的操作的选项。
 */
export interface LLMCategoryOptions {
  sourceDirectoryPath: string; // 源目录路径
  apiKey: string; // API 密钥
  baseUrl?: string; // LLM API 基础URL (可选，如果不提供则使用配置中的默认值)
  model?: string; // 使用的模型名称 (可选，如果不提供则使用配置中的默认值)
  classificationFocus?: string; // 分类焦点，例如 "按项目类型" 或 "按文件用途"
  numberOfCategories?: number; //期望生成的分类数量
  maxSamples?: number; // 用于 LLM 分析的最大文件名样本数量
  recursive?: boolean; // 是否递归收集文件名样本
}
