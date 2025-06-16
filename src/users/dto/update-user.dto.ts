import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @Matches(/^01[0-9]{8,9}$/)
  phoneNumber?: string;
}
