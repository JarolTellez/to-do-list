const SORT_CONSTANTS = require('../../infrastructure/constants/sortConstants');

class SortValidator{
  constructor({ errorFactory }) {
    this.errorFactory = errorFactory;
  }

  validateAndNormalizeSortParams(entity, options = {}) {
    const entityConfig = SORT_CONSTANTS.ENTITIES[entity];
    if (!entityConfig) {
      throw this.errorFactory.createValidationError(
        `Invalid entity for sort validation: ${entity}. Valid entities: ${Object.keys(SORT_CONSTANTS.ENTITIES).join(', ')}`
      );
    }
    const { FIELDS, DEFAULTS } = entityConfig;

    const {
      sortBy = DEFAULTS.SORT_BY,
      sortOrder = DEFAULTS.SORT_ORDER
    } = options;

    const allowedFields = Object.values(FIELDS);
    if (!allowedFields.includes(sortBy)) {
      throw this.errorFactory.createValidationError(
        `Campo de ordenamiento inválido para ${entity}: ${sortBy}`,
        {
            allowedSortsValue:allowedFields
        }
    
      );
    }

    const allowedOrders = Object.values(SORT_CONSTANTS.SORT_ORDER);
    if (!allowedOrders.includes(sortOrder.toLowerCase())) {
      throw this.errorFactory.createValidationError(
        `Valor de ordenamiento erroneo: ${sortOrder}`,
        {
            allowedOrders: allowedOrders
        }
      );
    }

    return {
      sortBy,
      sortOrder: sortOrder.toLowerCase()
    };
  }

  getAllowedFieldsFor(entity) {
    return SORT_CONSTANTS.ENTITIES[entity]?.FIELDS;
  }
  
  getDefaultFor(entity) {
    return SORT_CONSTANTS.ENTITIES[entity]?.DEFAULTS;
  }
}

module.exports = SortValidator;