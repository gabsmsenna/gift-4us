import { IsEmail, IsString, MinLength, IsDate, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { parse } from 'date-fns';

export class CreateUserDto {
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  @IsEmail({}, { message: 'Forneça um e-mail válido' })
  email: string;

  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  password: string;

  @Transform(({ value }) => {
    return parse(value, 'dd/MM/yyyy', new Date());
  })
  @IsDate({ message: 'Data de nascimento inválida. Use o formato dd/MM/yyyy' })
  birthday: Date;
}