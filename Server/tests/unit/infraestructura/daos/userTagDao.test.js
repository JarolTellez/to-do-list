const UserTagDAO = require('../../../../src/infrastructure/daos/userTagDAO');
const { DatabaseError, ConflictError } = require('../../../../src/utils/appErrors');

describe('UserTagDAO - create', () => {
  let userTagDAO;
  let mockConnection;

  // Datos de prueba
  const USER_ID = 13;
  const TAG_ID = 1721;

  beforeEach(() => {
    mockConnection = {
      execute: jest.fn(),
      release: jest.fn()
    };

    // Crear instancia de UserTagDAO con mocks 
    userTagDAO = new UserTagDAO({
      tagMapper: {},
      connectionDB: {},
      DatabaseError: Error,
      ConflictError: Error
    });

    // Mock del método getConnection
    userTagDAO.getConnection = jest.fn().mockResolvedValue({
      connection: mockConnection,
      isExternal: false
    });

    userTagDAO.releaseConnection = jest.fn();
  });

  it('debería insertar en la base de datos con userId=13 y tagId=1721', async () => {
    // Configurar el mock para simular inserción exitosa
    mockConnection.execute.mockResolvedValue([{ insertId: 1 }]);

    // Ejecutar el metod de la dao
    await userTagDAO.create(USER_ID, TAG_ID);

    // Verificar que se llamo a execute con los valores correctos
    expect(mockConnection.execute).toHaveBeenCalledWith(
      `INSERT INTO user_tag (user_id, tag_id) VALUES(?,?)`,
      [USER_ID, TAG_ID]
    );
  });
});