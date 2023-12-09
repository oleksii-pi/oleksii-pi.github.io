const systemPrompt = `
Тебе звати Марічка. 
Марічка - робот, який знає багато загадок. 
Ти розмовляєш з п'ятирічною дитиною.
Ти загадуєш загадку, а дитина намагається її відгадати.
Всі твої відповіді повинні бути короткими і простими.

Як відповідь ти використовуєш ТІЛЬКИ функції talk_and_listen, get_random_riddle, exit.
Ти завжди викликаеш функцію talk_and_listen коли потрібно відповісти користувачу.
Ця функція також повертає текст того, що каже користувач.
Коли я говорю "ти кажеш" - це означає, що ти викликаєш функцію talk_and_listen.

Якщо тобі потрібна нова загадка викликаєш функцію get_random_riddle.
Не вигадуй загадки, а використовуй тільки ті, що вертає тобі get_random_riddle.
Якщо користувач більше не хоче продовжувати грати, ти викликаєш функцію exit.
Якщо ніяка функція не викликається - це буде означати кінець розмови.

Твоїм першим повідомленням є виклик talk_and_listen з параметром text: 
'Привіт! Я робот Марічка. Я знаю багато загадок. Скажи "Так", якщо хочеш зіграти зі мною'.

Якщо користувач каже щось відмінне від "Так", ти кажеш щось із списку (викликай talk_and_listen):
'Скажи "Так", якщо хочеш зіграти зі мною', 'Не зрозуміла. Ти будеш грати?', 'Просто скажи "Так" якщо хочеш зіграти'.
Поки користувач не скаже "Так".

Коли користувач погоджується відгадувати наступну загадку, ти викликаеш get_random_riddle. 
У результаті виклику ти отримуєш загадку і відповідь.

Потім ти кажеш (викликай talk_and_listen): 
'Добре. Тоді слухай уважно мою загадку: {текст загадки}'

Якщо користувач не вгадує ти кажеш тільки "Ні" (викликай talk_and_listen). 
Ти запропонуваєш підказку після п'яти невірних відповідей.
Якщо користувач вгадує відповідь, ти говориш одну із похвал (викликай talk_and_listen):
"Молодець!", "Вірно!", "Ти вгадав!", "Класс!", "Точно!" і додаєш: "Хочеш ще?".

Якщо користувач каже "Так", гра продовжується.
Якщо користувач не хоче більше грати, ти викликаєш функцію exit.

Твоїм першим повідомленням ти викликаеш talk_and_listen з параметром text: 
'Привіт! Я робот Марічка. Я знаю багато загадок. Скажи "Так", якщо хочеш зіграти зі мною'.
`;

const functions = [
  {
    name: "get_random_riddle",
    description: "Returns random riddle text with answer",
    parameters: {
      type: "object",
      properties: {
        dummy: {
          type: "null",
        },
      },
    },
  },
  {
    name: "talk_and_listen",
    description: "Provide text to user and return user's response.",
    parameters: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Text that should be said to user.",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "exit",
    description: "Call this function to exit conversation.",
    parameters: {
      type: "object",
      properties: {
        dummy: {
          type: "null",
        },
      },
    },
  },
];

async function getOpenAiSecretKey() {
  let openaiSecretKey = localStorage.getItem("openaiSecretKey");
  if (!openaiSecretKey) {
    openaiSecretKey = prompt(
      "Please enter your OpenAI secret key. You can enable paid plan here https://platform.openai.com/account/billing/overview and generate secret key here https://platform.openai.com/account/api-keys"
    );
    localStorage.setItem("openaiSecretKey", openaiSecretKey);
  }
  return openaiSecretKey;
}

async function runConversation() {
  const secretKey = await getOpenAiSecretKey();
  const messages = [{ role: "system", content: systemPrompt }];

  document.getElementById("aiMessageLabel").innerText = "Думаю...";

  let responseMessage = await streamAnswer({
    messages,
    functions,
    secretKey,
  });

  while (true) {
    if (responseMessage.function_call) {
      // Note: the JSON response may not always be valid; be sure to handle errors
      const availableFunctions = {
        get_random_riddle,
        talk_and_listen,
      };
      const functionName = responseMessage.function_call.name;
      if (functionName == "exit") {
        document.getElementById("aiMessageLabel").innerText = "До зустрічі!";
        return "Conversation is over.";
      }
      const functionToCall = availableFunctions[functionName];
      const functionArgument = JSON.parse(
        responseMessage.function_call.arguments
      );

      if (functionToCall === talk_and_listen) {
        const input = document.getElementById("textInput");
        input.style.display = "block";
        input.focus();
      }
      const functionResponse = await functionToCall(functionArgument);
      document.getElementById("textInput").style.display = "none";
      document.getElementById("aiMessageLabel").innerText = "Думаю...";

      messages.push(responseMessage);
      messages.push({
        role: "function",
        name: functionName,
        content: functionResponse,
      });

      responseMessage = await streamAnswer({
        messages,
        functions,
        secretKey,
      });
    } else {
      return "Error: no function call. Conversation is over.";
    }
  }
}

function startButtonClick() {
  document.getElementById("startButton").style.display = "none";

  runConversation().then(console.log).catch(console.error);
}
