import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppConfigService } from './config.service';

describe('AppConfigService', () => {
  let service: AppConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppConfigService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'database.host': 'localhost',
                'database.port': 5432,
                'database.username': 'user',
                'database.password': 'pass',
                'database.database': 'test_db',
                'jwt.secret': 'secret',
                'jwt.expiresIn': '1d',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AppConfigService>(AppConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return database configuration', () => {
    const dbConfig = service.database;
    expect(dbConfig.host).toBe('localhost');
    expect(dbConfig.port).toBe(5432);
    expect(dbConfig.username).toBe('user');
    expect(dbConfig.password).toBe('pass');
    expect(dbConfig.database).toBe('test_db');
  });

  it('should return JWT configuration', () => {
    const jwtConfig = service.jwt;
    expect(jwtConfig.secret).toBe('secret');
    expect(jwtConfig.expiresIn).toBe('1d');
  });
});
