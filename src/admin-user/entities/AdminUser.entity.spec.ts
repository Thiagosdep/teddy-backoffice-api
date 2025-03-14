import { AdminUserEntity } from './AdminUser.entity';

describe('AdminUserEntity', () => {
  it('should create an instance of AdminUserEntity', () => {
    const adminUser = new AdminUserEntity();
    adminUser.id = 'test-uuid';
    adminUser.login = 'admin';
    adminUser.password = 'hashedPassword';

    expect(adminUser).toBeDefined();
    expect(adminUser.id).toEqual('test-uuid');
    expect(adminUser.login).toEqual('admin');
    expect(adminUser.password).toEqual('hashedPassword');
  });

  it('should have the correct properties', () => {
    const adminUser = new AdminUserEntity();

    expect(adminUser).toHaveProperty('id');
    expect(adminUser).toHaveProperty('login');
    expect(adminUser).toHaveProperty('password');
  });
});
