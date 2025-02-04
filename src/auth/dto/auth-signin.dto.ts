import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length, IsEmail } from 'class-validator';
import xss from 'xss';

export class AuthSigninDto {
  @IsNotEmpty()
  @IsString()
  @Length(4, 20)
  @Transform(({ value }) => xss(value.trim()))
  username: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail({}, { message: 'Invalid email format' })
  @Transform(({ value }) => xss(value.trim()))
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(4, 20)
  @Transform(({ value }) => xss(value.trim()))
  password: string;
}
