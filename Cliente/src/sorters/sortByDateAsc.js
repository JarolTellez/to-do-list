import { SortStrategy } from "./sortStrategy.js";
export class SortByDateAsc extends SortStrategy {
  sort(tasks) {
    return [...tasks].sort((a, b) => {
      return a.fechaProgramada == null
        ? 1
        : b.fechaProgramada == null
        ? -1
        : this.parseDateTime(a.fechaProgramada) -
          this.parseDateTime(b.fechaProgramada);
    });
  }

  parseDateTime(date) {
    if (!date) return null;

    if (date.includes("T")) {
      return new Date(date);
    }

    try {
      const [datePart, timePart] = date.split(", ");
      const [month, day, year] = datePart.split("/");
      const [time, modifier] = timePart.split(" ");
      let [hours, minutes, seconds] = time.split(":");

      if (modifier === "PM" && hours !== "12") {
        hours = parseInt(hours, 10) + 12;
      }
      if (modifier === "AM" && hours === "12") {
        hours = "00";
      }

      hours = String(hours).padStart(2, "0");
      minutes = String(minutes).padStart(2, "0");
      seconds = String(seconds || "00").padStart(2, "0");

      const fechaISO = `${year}-${month.padStart(2, "0")}-${day.padStart(
        2,
        "0"
      )}T${hours}:${minutes}:${seconds}`;
      return new Date(fechaISO);
    } catch (error) {
      console.error("Error al convertir la fecha:", error);
      return null;
    }
  }
}
