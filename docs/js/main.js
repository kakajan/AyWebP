function copyText(text, button) {
  navigator.clipboard.writeText(text).then(() => {
    const original = button.textContent;
    button.textContent = "Copied!";
    button.classList.add("copied");
    setTimeout(() => {
      button.textContent = original;
      button.classList.remove("copied");
    }, 2000);
  });
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.getAttribute("data-copy");
    const target = document.getElementById(targetId);
    if (target) {
      copyText(target.textContent.trim(), button);
    }
  });
});
