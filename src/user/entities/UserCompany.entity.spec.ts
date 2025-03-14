import { UserCompanyEntity } from './UserCompany.entity';
import { UserEntity } from './User.entity';
import { randomUUID } from 'crypto';

describe('UserCompanyEntity', () => {
  it('should create a user company entity with constructor', () => {
    // Arrange
    const userCompanyData = {
      name: 'Company A',
      companyValue: 1000000,
      userId: randomUUID(),
      active: true,
    };

    // Act
    const userCompany = new UserCompanyEntity(userCompanyData);

    // Assert
    expect(userCompany).toBeDefined();
    expect(userCompany.name).toBe(userCompanyData.name);
    expect(userCompany.companyValue).toBe(userCompanyData.companyValue);
    expect(userCompany.userId).toBe(userCompanyData.userId);
    expect(userCompany.active).toBe(userCompanyData.active);
  });

  it('should create a user company entity with all properties', () => {
    // Arrange
    const now = new Date();
    const userCompanyData = {
      id: randomUUID(),
      name: 'Company A',
      companyValue: 1000000,
      userId: randomUUID(),
      active: true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    // Act
    const userCompany = new UserCompanyEntity(userCompanyData);

    // Assert
    expect(userCompany).toBeDefined();
    expect(userCompany.id).toBe(userCompanyData.id);
    expect(userCompany.name).toBe(userCompanyData.name);
    expect(userCompany.companyValue).toBe(userCompanyData.companyValue);
    expect(userCompany.userId).toBe(userCompanyData.userId);
    expect(userCompany.active).toBe(userCompanyData.active);
    expect(userCompany.createdAt).toBe(userCompanyData.createdAt);
    expect(userCompany.updatedAt).toBe(userCompanyData.updatedAt);
    expect(userCompany.deletedAt).toBe(userCompanyData.deletedAt);
  });

  it('should properly establish relationship with UserEntity', () => {
    // Arrange
    const user = new UserEntity({
      id: randomUUID(),
      name: 'John Doe',
      email: 'john@example.com',
      ownRemuneration: 5000,
    });

    const userCompany = new UserCompanyEntity({
      name: 'Company A',
      companyValue: 1000000,
      userId: user.id,
      active: true,
    });

    // Act
    userCompany.user = user;
    user.userCompanies = [userCompany];

    // Assert
    expect(userCompany.user).toBe(user);
    expect(user.userCompanies).toHaveLength(1);
    expect(user.userCompanies[0]).toBe(userCompany);
    expect(userCompany.userId).toBe(user.id);
  });

  it('should set active to true by default', () => {
    // Arrange & Act
    const userCompany = new UserCompanyEntity({
      name: 'Company A',
      companyValue: 1000000,
      userId: randomUUID(),
    });

    // Assert
    expect(userCompany.active).toBe(true);
  });
});
