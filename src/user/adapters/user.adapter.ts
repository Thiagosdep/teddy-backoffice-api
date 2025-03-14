import { UserEntity } from '../entities/User.entity';
import { UserDTO } from '../dtos/user.controller.dto';

export class UserAdapter {
  static toUserDTO(user: UserEntity): UserDTO {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      own_remuneration: user.ownRemuneration,
      user_companies: user.userCompanies.map((userCompany) => ({
        id: userCompany.id,
        name: userCompany.name,
        company_value: userCompany.companyValue,
        active: userCompany.active,
      })),
    };
  }
}
