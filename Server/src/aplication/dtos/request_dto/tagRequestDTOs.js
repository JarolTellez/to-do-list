class CreateTagRequestDTO {
    constructor({ name, description = "" }) {
        this.name = name;
        this.description = description;
    }
}

class UpdateTagRequestDTO {
    constructor({ name, description }) {
        this.name = name;
        this.description = description;
    }
}