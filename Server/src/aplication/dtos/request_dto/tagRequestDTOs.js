class TagRequestDTO {
    constructor({ id=null,name, description = "" }) {
        this.id=id;
        this.name = name;
        this.description = description;
    }
}

class UpdateTagRequestDTO {
    constructor({ id,name, description }) {
        this.id=id;
        this.name = name;
        this.description = description;
    }
}

module.exports = {
    TagRequestDTO,
    UpdateTagRequestDTO
};