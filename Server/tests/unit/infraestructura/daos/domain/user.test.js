const User = require('../../../../../src/domain/entities/user');
const { ValidationError } = require('../../../../../src/utils/appErrors');
const UserTag = require('../../../../../src/domain/entities/userTag');

describe('User Class', () => {
  // Test 1: Creacion
  test('should create user with valid data', () => {
    const user = new User({
      userName: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    expect(user.userName).toBe('testuser');
    expect(user.email).toBe('test@example.com');
    expect(user.rol).toBe('usuario');
  });

  // Test 2: Validacion de username
  test('should throw error for short username', () => {
    expect(() => {
      new User({
        userName: 'ab',
        email: 'test@example.com',
        password: 'password123'
      });
    }).toThrow(ValidationError);
  });

  // Test 3: Validacion de email
  test('should throw error for invalid email', () => {
    expect(() => {
      new User({
        userName: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      });
    }).toThrow(ValidationError);
  });

  // Test 4: Validacion de password
  test('should throw error for short password', () => {
    expect(() => {
      new User({
        userName: 'testuser',
        email: 'test@example.com',
        password: 'short'
      });
    }).toThrow(ValidationError);
  });

  // Test 5: Actualizacion de username
  test('should update username correctly', () => {
    const user = new User({
      userName: 'olduser',
      email: 'test@example.com',
      password: 'password123'
    });

    user.updateUserName('newuser');
    expect(user.userName).toBe('newuser');
  });

  // Test 6: Añadir userTag (CORREGIDO)
  test('should add userTag correctly', () => {
    const user = new User({
      id: 1, 
      userName: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    // UserTag necesita userId Y tagId 
    const userTag = new UserTag({
      id: 1,
      userId: user.id,    
      tagId: 100,         
      createdAt: new Date()
    });
    
    user.addUserTag(userTag);
    expect(user.userTags.length).toBe(1);
    expect(user.hasTag(100)).toBe(true);
  });

  // Test 7: Eliminar userTag (CORREGIDO)
  test('should remove userTag correctly', () => {
    const user = new User({
      id: 1,
      userName: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    // UserTag necesita userId Y tagId
    const userTag = new UserTag({
      id: 1,
      userId: user.id,    
      tagId: 100,        
      createdAt: new Date()
    });
    
    user.addUserTag(userTag);
    user.removeUserTag(1);

    expect(user.userTags.length).toBe(0);
    expect(user.hasTag(100)).toBe(false);
  });

  // Test 8: Rol por defecto
  test('should have default role "usuario"', () => {
    const user = new User({
      userName: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    expect(user.rol).toBe('usuario');
    expect(user.isAdmin()).toBe(false);
  });

  // Test 9: Rol admin
  test('should recognize admin role', () => {
    const user = new User({
      userName: 'adminuser',
      email: 'admin@example.com',
      password: 'password123',
      rol: 'admin'
    });

    expect(user.isAdmin()).toBe(true);
  });

  // Test 10: Metodo toJSON
  test('should return correct JSON representation', () => {
    const user = new User({
      userName: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });

    const json = user.toJSON();
    expect(json.userName).toBe('testuser');
    expect(json.email).toBe('test@example.com');
    expect(json.userTagsCount).toBe(0);
  });

  // Validar que no se puede añadir UserTag sin userId
  test('should throw error when adding UserTag without proper userId', () => {
    const user = new User({
      userName: 'testuser', // Sin id
      email: 'test@example.com',
      password: 'password123'
    });

    expect(() => {
      const userTag = new UserTag({
        id: 1,
        userId: null, // userId null debería fallar
        tagId: 100
      });
    }).toThrow(ValidationError);
  });
});