import { Specification } from "./operator_base/Specification.js";

export class DueTodaySpecification extends Specification {
  satisfies(task) {
    if (!task.scheduledDate) return false;

    const currentDate = new Date();
    const dateWithoutTime = task.scheduledDate.split(",")[0];
    const [month, day, year] = dateWithoutTime.split("/");

    const taskDate = new Date(year, month - 1, day);

    return currentDate.toDateString() === taskDate.toDateString();
  }
}
