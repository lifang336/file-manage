// src/main-process-modules/llmService.ts
import OpenAI from "openai";

/**
 * @interface LLMCompletionChoice
 * @description OpenAI API 返回的 choice 结构的一部分
 */
interface LLMCompletionChoice {
  message: {
    content: string | null;
    // 根据 OpenAI 的类型定义，这里可能还有 role 等字段，但我们主要关心 content
  };
  // 根据 OpenAI 的类型定义，这里可能还有 finish_reason, index, logprobs 等字段
}

/**
 * @interface LLMCompletion
 * @description OpenAI API chat completions 返回的结构的一部分
 */
interface LLMCompletion {
  choices: LLMCompletionChoice[];
  // 根据 OpenAI 的类型定义，这里可能还有 id, object, created, model, system_fingerprint, usage 等字段
}

/**
 * @function getSuggestionsFromLLM
 * @description 调用 OpenAI 兼容的 API 获取分类建议。
 * @param apiKey - API 密钥。
 * @param promptMessages - 发送给 LLM 的消息数组 (system 和 user roles)。
 * @param model - 使用的 LLM 模型，默认为 "qwen-plus-latest"。
 * @param baseUrl - API 基础URL，默认为阿里云DashScope。
 * @returns Promise，解析为字符串数组形式的分类建议。
 * @throws 如果 API 调用失败或响应格式不正确，则抛出错误。
 */
export async function getSuggestionsFromLLM(
  apiKey: string,
  promptMessages: Array<{ role: "system" | "user"; content: string }>,
  model: string = "qwen-plus-latest",
  baseUrl: string = "https://dashscope.aliyuncs.com/compatible-mode/v1"
): Promise<string[]> {
  const openai = new OpenAI({
    apiKey,
    baseURL: baseUrl,
  });
  console.log(
    `[LLMService] Calling LLM API for category suggestions... (Model: ${model}, BaseURL: ${baseUrl})`
  );

  try {
    const completion = (await openai.chat.completions.create({
      model: model,
      messages: promptMessages as any, // 类型断言以匹配 OpenAI 库的期望
      temperature: 0.5,
      response_format: { type: "json_object" }, // 请求 JSON 输出
    })) as LLMCompletion; // 类型断言整个 completion 对象

    const responseContent = completion.choices[0]?.message?.content;
    console.log(
      `[LLMService] Raw response for suggestions (first 200 chars): ${responseContent?.substring(
        0,
        200
      )}...`
    );

    if (!responseContent) {
      throw new Error("LLM returned empty content for suggestions.");
    }

    let parsedSuggestions: any;
    try {
      const jsonResponse = JSON.parse(responseContent);
      if (Array.isArray(jsonResponse)) {
        parsedSuggestions = jsonResponse;
      } else if (typeof jsonResponse === "object" && jsonResponse !== null) {
        const keys = Object.keys(jsonResponse);
        const arrayKey = keys.find((key) => Array.isArray(jsonResponse[key]));
        if (arrayKey) {
          parsedSuggestions = jsonResponse[arrayKey];
        } else {
          throw new Error(
            "LLM JSON response for suggestions does not contain an array."
          );
        }
      } else {
        throw new Error(
          "LLM JSON response for suggestions is not an array or an object containing an array."
        );
      }

      if (
        !Array.isArray(parsedSuggestions) ||
        !parsedSuggestions.every((item) => typeof item === "string")
      ) {
        throw new Error(
          "Parsed LLM suggestions data is not an array of strings."
        );
      }
      console.log(
        `[LLMService] Successfully parsed ${parsedSuggestions.length} suggestions.`
      );
      return parsedSuggestions;
    } catch (parseError: any) {
      console.error(
        `[LLMService] Failed to parse LLM suggestions response: ${parseError.message}`,
        `Content: ${responseContent}`
      );
      throw new Error(
        `Failed to parse LLM suggestions response: ${parseError.message}`
      );
    }
  } catch (error: any) {
    console.error(
      `[LLMService] OpenAI API call for suggestions failed: ${error.message}`
    );
    if (error.response) {
      console.error(
        `[LLMService] OpenAI API error details: ${JSON.stringify(
          error.response.data
        )}`
      );
    }
    throw new Error(`OpenAI API call for suggestions failed: ${error.message}`);
  }
}

/**
 * @function getClassifyResultFromLLM
 * @description 调用 OpenAI 兼容的 API 对单个文件进行分类。
 * @param apiKey - API 密钥。
 * @param promptMessages - 发送给 LLM 的消息数组 (system 和 user roles)。
 * @param categories - 用户确认的分类列表，用于验证 LLM 的返回。
 * @param model - 使用的 LLM 模型，默认为 "qwen-plus-latest"。
 * @param baseUrl - API 基础URL，默认为阿里云DashScope。
 * @returns Promise，解析为分类名称字符串，如果无法分类或分类无效则为 null。
 * @throws 如果 API 调用失败，则抛出错误。
 */
export async function getClassifyResultFromLLM(
  apiKey: string,
  promptMessages: Array<{ role: "system" | "user"; content: string }>,
  categories: string[], // 用于验证返回的分类是否在列表中
  model: string = "qwen-plus-latest",
  baseUrl: string = "https://dashscope.aliyuncs.com/compatible-mode/v1"
): Promise<string | null> {
  const openai = new OpenAI({
    apiKey,
    baseURL: baseUrl,
  });
  // 从 promptMessages 中提取文件名用于日志
  const userMessage =
    promptMessages.find((m) => m.role === "user")?.content || "";
  const fileNameMatch = userMessage.match(/文件名："([^"]+)"/);
  const fileNameForLog = fileNameMatch ? fileNameMatch : "unknown_file";
  console.log(
    `[LLMService] Calling LLM API for classifying file: ${fileNameForLog}... (Model: ${model}, BaseURL: ${baseUrl})`
  );

  try {
    const completion = (await openai.chat.completions.create({
      model: model,
      messages: promptMessages as any,
      temperature: 0.3,
      max_tokens: 50, // 分类名称通常较短
    })) as LLMCompletion;

    const assignedCategory = completion.choices?.[0]?.message?.content?.trim();
    console.log(
      `[LLMService] Raw classification response for "${fileNameForLog}": "${assignedCategory}"`
    );

    if (assignedCategory && categories.includes(assignedCategory)) {
      return assignedCategory;
    } else if (assignedCategory === "Uncategorized") {
      return null; // 代表 LLM 明确表示未分类
    } else {
      console.log(
        `[LLMService] LLM returned invalid or unlisted category for "${fileNameForLog}": "${assignedCategory}". Treating as unclassified.`
      );
      return null; // 其他意外情况或不在列表中的分类也视为未分类
    }
  } catch (error: any) {
    console.error(
      `[LLMService] LLM API call for classifying file "${fileNameForLog}" failed: ${error.message}`
    );
    if (error.response) {
      console.error(
        `[LLMService] LLM API error details: ${JSON.stringify(
          error.response.data
        )}`
      );
    }
    // API 调用失败也视为未分类，以便主流程可以继续处理（例如放入未分类文件夹）
    return null;
  }
}
