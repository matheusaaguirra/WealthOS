import { IsEmail, IsInt, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength, IsIn } from 'class-validator';

export class RegisterDto {
  @IsEmail() @MaxLength(254) email!: string;
  @IsString() @MinLength(10) @MaxLength(72) password!: string;
  @IsString() @MinLength(2) @MaxLength(100) @Matches(/\S/) name!: string;
}
export class LoginDto {
  @IsEmail() @MaxLength(254) email!: string;
  @IsString() @MinLength(1) @MaxLength(72) password!: string;
}
export class AccountDto {
  @IsString() @MinLength(1) @MaxLength(100) @Matches(/\S/) name!: string;
  @IsString() @MinLength(1) @MaxLength(100) @Matches(/\S/) institution!: string;
  @IsString() @Matches(/^#[0-9a-fA-F]{6}$/) color!: string;
  @IsInt() @Min(-1000000000) @Max(1000000000) openingBalanceCents!: number;
}
export class TransactionDto {
  @IsUUID() accountId!: string;
  @IsString() @MinLength(1) @MaxLength(200) @Matches(/\S/) description!: string;
  @IsInt() @Min(1) @Max(1000000000) amountCents!: number;
  @IsIn(['INCOME', 'EXPENSE']) type!: 'INCOME' | 'EXPENSE';
  @IsString() @MinLength(1) @MaxLength(80) @Matches(/\S/) category!: string;
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) date!: string;
  @IsString() @MinLength(8) @MaxLength(100) @Matches(/^[a-zA-Z0-9_-]+$/) idempotencyKey!: string;
}
