import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsValidCountry } from '../../modules/common/validator/country.validator';
import { IsValidPhoneNumber } from '../../modules/common/validator/phone.validator';
import { ResponseMessage } from '../../utils/enum';
import { SameAs } from './../common/validator/same-as.validator';

export class RegisterPayload {
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9$&+,:;=?@#|'<>.^*()%!-]{3,26}$/, {
    message: ResponseMessage.INVALID_USERNAME,
  })
  @Matches(/^(?!.*[$&+,:;=?@#|'<>.^*()%!-]{2}).*$/, {
    message: ResponseMessage.INVALID_USERNAME,
  })
  userName: string;

  @IsNotEmpty()
  @Matches(/^[a-zA-Z ]{3,26}$/, {
    message: ResponseMessage.INVALID_NAME,
  })
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  @Matches(
    /^[a-zA-Z]+[a-zA-Z0-9_\.\-]*[a-zA-Z0-9]+\@(([a-zA-Z0-9\-]){3,30}\.)+([a-zA-Z0-9]{2,5})$/,
    { message: ResponseMessage.INVALID_EMAIL },
  )
  @Matches(/^(?!.*[\-\_\.]{2}).*$/, { message: ResponseMessage.INVALID_EMAIL })
  email: string;

  @IsNotEmpty()
  @IsValidCountry()
  country: string;

  @IsNotEmpty()
  @IsValidPhoneNumber()
  phoneNumber: string;

  @IsNotEmpty()
  @MinLength(8, { message: ResponseMessage.INVALID_PASSWORD })
  @MaxLength(15, { message: ResponseMessage.INVALID_PASSWORD })
  @Matches(/(?=.*\d)(?=.*\W+)(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: ResponseMessage.INVALID_PASSWORD,
  })
  password: string;

  @SameAs('password')
  passwordConfirmation: string;
}

export class ForgotPasswordDto {
  @IsNotEmpty()
  @MinLength(8, { message: ResponseMessage.INVALID_PASSWORD })
  @MaxLength(15, { message: ResponseMessage.INVALID_PASSWORD })
  @Matches(/(?=.*\d)(?=.*\W+)(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: ResponseMessage.INVALID_PASSWORD,
  })
  password: string;
}

export class EmailDto {
  @IsEmail()
  @IsNotEmpty()
  @Matches(
    /^[a-zA-Z]+[a-zA-Z0-9_\.\-]*[a-zA-Z0-9]+\@(([a-zA-Z0-9\-]){3,30}\.)+([a-zA-Z0-9]{2,5})$/,
    { message: ResponseMessage.INVALID_EMAIL },
  )
  @Matches(/^(?!.*[\-\_\.]{2}).*$/, { message: ResponseMessage.INVALID_EMAIL })
  email: string;
}
