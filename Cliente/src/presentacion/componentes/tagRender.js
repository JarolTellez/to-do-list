import { Tag } from "../../models/tagModel.js";

//EESTA GUARDA LAS ETIQUETAS SELECCIONADAS POR EL USUARIO EN EL INPUT LA PUEDO PASAR A ESTADO GLOBAL
export const selectedTags = [];
const tags = [];

const userId = sessionStorage.getItem("userId");

export const tagComponent = {
  renderTags(tagsList) {
      console.log("ETIQUETAS EN RENDERIZACION: ",selectedTags);
    tagsList.innerHTML = "";

    selectedTags
      .filter((tag) => !tag.toDelete)
      .forEach((tag) => {
        const li = document.createElement("li");

        if (tag.id) {
          li.setAttribute("data-id", tag.id);
        }

        li.textContent = tag.name;

        const deleteBtn = document.createElement("span");
        deleteBtn.textContent = " x";
        deleteBtn.className = "btnEliminarEtiqueta";

        deleteBtn.addEventListener("click", () => {
          console.log(`\nEliminando tag: "${tag.name}"`);
          this.delete(tag.name);
          this.renderTags(tagsList);
        });

        li.appendChild(deleteBtn);
        tagsList.appendChild(li);
      });
    
  },

  delete(tagName) {
    const index = selectedTags.findIndex(
      (tag) => tag.name === tagName
    );

    if (index !== -1) {
      const tag = selectedTags[index];

      if (tag.exists && tag.taskTagId) {
        tag.toDelete = true;
        console.log(`Marcada como toDelete: "${tagName}"`);
      } else {
        selectedTags.splice(index, 1);
        console.log(`Eliminada totalmente: "${tagName}"`);
      }

      console.log("Lista actual de tags seleccionadas:");
      console.log(JSON.stringify(selectedTags, null, 2));
    }
  },

  async showConsultedTags(
    query,
    consultedContainer,
    tagInput,
    consultedTags
  ) {
    consultedContainer.innerHTML = "";

    if (query) {
      tags.length = 0;
      consultedTags.forEach((el) => tags.push(el));

      const filteredTags = consultedTags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(query.toLowerCase()) &&
          !selectedTags.find(
            (el) => el.name === tag.name && !el.toDelete
          )
      );

      if (filteredTags.length > 0) {
        filteredTags.forEach((tag) => {
          const li = document.createElement("li");
          li.textContent = tag.name;
          li.setAttribute("data-id", tag.id);

          li.addEventListener("click", () => {
            this.addTagInput(
              tag,
              tagsList,
              consultedContainer,
              tagInput
            );
          });

          consultedContainer.appendChild(li);
        });

        consultedContainer.classList.add("active");
      } else {
        consultedContainer.classList.remove("active");
      }
    } else {
      consultedContainer.classList.remove("active");
    }
  },

  addTagInput(tag, tagsList, consultedContainer, tagInput) {
    const tagsToAdd = Array.isArray(tag) ? tag : [tag];

    tagsToAdd.forEach((el) => {
      const exists = selectedTags.find(
        (e) => e.name === el.name
      );

      if (exists) {
        exists.toDelete = false;
        console.log(`Restaurada tag: "${el.name}"`);
      } else {
        selectedTags.push(el);
        console.log(`Agregada nueva tag: "${el.name}"`);
      }
    });

    console.log("Lista actual de tags seleccionadas:");
    console.log(JSON.stringify(selectedTags, null, 2));

    this.renderTags(tagsList);
    tagInput.value = "";
    this.showConsultedTags("", consultedContainer, tagInput, tags);
  },

  findMatches(textTag) {
    const registeresTag = tags.find(
      (el) => el.name.toLowerCase() === textTag.toLowerCase()
    );

    const selected = selectedTags.find(
      (el) => el.name.toLowerCase() === textTag.toLowerCase() && !el.toDelete
    );

    if (selected) {
      console.log(`Ya está seleccionada: "${textTag}"`);
      return false;
    }

    if (typeof textTag === "object") {
      console.log("Tag recibida como objeto:", textTag);
      return textTag;
    }

    const newTag = registeresTag
      ? new Tag(
          registeresTag.id,
          registeresTag.name,
          registeresTag.descripcion,
          true, // exists
          false,
          userId,
          registeresTag.taskTagId || null
        )
      : new Tag(
          null,
          textTag,
          null,
          false,
          false,
          userId,
          null
        );

    console.log("Resultado de buscarCoincidencias:");
    console.log(newTag);
    return newTag;
  },
};
