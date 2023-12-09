async function talk_and_listen({ text }) {
  const inputElement = document.getElementById("textInput");
  const labelElement = document.getElementById("aiMessageLabel");

  labelElement.innerText = text;

  return new Promise((resolve) => {
    inputElement.addEventListener("keypress", function onKeyPress(event) {
      if (event.key === "Enter") {
        inputElement.removeEventListener("keypress", onKeyPress);
        resolve(inputElement.value);
        inputElement.value = "";
      }
    });
  });
}
