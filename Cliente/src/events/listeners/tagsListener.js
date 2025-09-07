
import { tagsHandler } from "../handlers/tagsHandler.js";

document.addEventListener("DOMContentLoaded", function () {
  const tagInput = document.getElementById("inputContainer");
  const tagsList = document.getElementById("tagsList");
  const consultedContainer = document.getElementById("consulted");
  
  setUpEvents();

  function setUpEvents() {
    // Evento para que se busque etiquetas cuando se esta escribiendo
    tagInput.addEventListener("input", async (e) => {
      const query = e.target.value.trim();
      await tagsHandler.handleInputChange(query, consultedContainer, tagInput);
    });

    // Evento para agregar eiquetas al campo cuando se haga espacio o enter
    tagInput.addEventListener("keydown", (e) => {
      tagsHandler.handleKeyDown(e, tagInput, tagsList, consultedContainer);
    });
  }
});