import { UserEntity } from './User.entity';
import { UserCompanyEntity } from './UserCompany.entity';
import { randomUUID } from 'crypto';
describe('UserEntity', () => {
  it('should create a user entity with constructor', () => {
    // Arrange
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      ownRemuneration: 5000,
    };

    // Act
    const user = new UserEntity(userData);

    // Assert
    expect(user).toBeDefined();
    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email);
    expect(user.ownRemuneration).toBe(userData.ownRemuneration);
  });

  it('should create a user entity with all properties', () => {
    // Arrange
    const now = new Date();
    const userData = {
      id: randomUUID(),
      name: 'John Doe',
      email: 'john@example.com',
      ownRemuneration: 5000,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      userCompanies: [],
    };

    // Act
    const user = new UserEntity(userData);

    // Assert
    expect(user).toBeDefined();
    expect(user.id).toBe(userData.id);
    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email);
    expect(user.ownRemuneration).toBe(userData.ownRemuneration);
    expect(user.createdAt).toBe(userData.createdAt);
    expect(user.updatedAt).toBe(userData.updatedAt);
    expect(user.deletedAt).toBe(userData.deletedAt);
    expect(user.userCompanies).toEqual([]);
  });

  it('should properly establish relationship with UserCompanyEntity', () => {
    // Arrange
    const user = new UserEntity({
      name: 'John Doe',
      email: 'john@example.com',
      ownRemuneration: 5000,
    });

    const userCompany = new UserCompanyEntity({
      name: 'Company A',
      companyValue: 1000000,
      userId: randomUUID(),
      active: true,
    });

    // Act
    user.userCompanies = [userCompany];
    userCompany.user = user;

    // Assert
    expect(user.userCompanies).toHaveLength(1);
    expect(user.userCompanies[0]).toBe(userCompany);
    expect(userCompany.user).toBe(user);
  });
});
