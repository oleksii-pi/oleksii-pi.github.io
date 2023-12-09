const defaultAIModelName = "gpt-3.5-turbo";
const defaultMaxTokens = 500;
const defaultTemperature = 0;

async function streamAnswer({
  messages,
  functions,
  model,
  maxTokens,
  temperature,
  abortController,
  secretKey,
  onPartialResponse,
  onError,
}) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + secretKey,
      },
      body: JSON.stringify({
        messages,
        functions,
        model: model ?? defaultAIModelName,
        function_call: "auto",
        //function_call: { name: "talk_and_listen" },
        max_tokens: maxTokens ?? defaultMaxTokens,
        temperature: temperature ?? defaultTemperature,
        n: 1,
        stream: true,
      }),
      signal: abortController?.signal,
    });

    if (!response.ok) {
      switch (response.status) {
        case 429:
          onError(
            "Rate limit exceeded. Please wait before making another request."
          );
          break;
        case 401:
          const responseBody = await response.json();
          onError(responseBody.error.message);
          break;
        default:
          onError(`Fetch failed. Status code: ${response.status}`);
      }
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullAnswer = "";
    let function_call = null;
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      const sseString = decoder.decode(value);

      const sseArray = sseString
        .split("\n")
        .filter((line) => line.startsWith("data:") && line !== "data: [DONE]")
        .map((line) => JSON.parse(line.substring(6).trim()));

      const partialTex = sseArray
        .map((x) => x.choices[0].delta.content)
        .filter((x) => x)
        .join("");

      sseArray.forEach((x) => {
        const f = x.choices[0].delta.function_call;
        if (f) {
          if (function_call === null) {
            function_call = { name: "", arguments: "" };
          }
          function_call.name += f.name ?? "";
          function_call.arguments += f.arguments ?? "";
        }
      });
      fullAnswer += partialTex;
      if (onPartialResponse) {
        onPartialResponse(partialTex);
      }
      if (sseString.includes("data: [DONE]")) {
        break;
      }
    }
    fullAnswer = fullAnswer == "" ? null : fullAnswer;
    console.log({
      request: arguments[0],
      responseMessage: {
        role: "assistant",
        content: fullAnswer,
        function_call,
      },
    });
    return { role: "assistant", content: fullAnswer, function_call };
  } catch (error) {
    if (onError && error.name !== "AbortError") {
      onError(error);
    }
  }
}
