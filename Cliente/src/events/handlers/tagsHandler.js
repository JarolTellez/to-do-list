import { tagComponent } from "../../presentacion/componentes/tagRender.js";
import { loadTags } from "../../core/services/tags.js";

export const tagsHandler = {
  async handleInputChange(query, consultedContainer, tagInput) {
    if (query) {
      const consultedTags = await loadTags();
      if (consultedTags) {
        await tagComponent.showConsultedTags(
          query,
          consultedContainer,
          tagInput,
          consultedTags
        );
      }
    } else {
      consultedContainer.classList.remove("active");
    }
  },

  handleKeyDown(e, tagInput, listaEtiquetas, consultedContainer) {
    if (e.key === " " || e.key === "Enter") {
      const query = tagInput.value.trim();
      if (query) {
        const enteredTag = tagComponent.findMatches(query);
        console.log("etiqueta:", enteredTag);
        if (enteredTag) {
          tagComponent.addTagInput(
            enteredTag,
            listaEtiquetas,
            consultedContainer,
            tagInput
          );
        }
        tagInput.value = "";
      }
    }
  }
};