export enum ResponseMessage {
  CONFIRAMATION_EMAIL_SENT = `Email has been sent to you for verification, Kindly verify your email to get access to the system.`,
  SUCCESS = `Success`,
  CREATED_SUCCESSFULLY = `Created successfully`,
  EMAIL_CONFIRMED = `Email Confirmed Successfully`,
  EMAIL_LINK_EXPIRED = `This email link has been expired`,
  FORGOT_PASSWORD_EMAIL = `Please Check Your Email`,
  INVALID_CREDENTIALS = `Invalid credentials!`,
  DOES_NOT_EXIST = `Does Not Exist`,
  ERROR_WHILE_DISTRIBUTING_BONUS = `Error While Distributing The Bonus`,
  INVALID_QUERY_PARAM = `Invalid query parameter`,
  USER_ALREADY_EXISTS = `User with the same email already exists`,
  USER_DOES_NOT_EXIST = `User with specified email does not exists`,
  USERNAME_ALREADY_TAKEN = `User with the same username already exists, please try another one.`,
  EMAIL_NOT_REGISTERED = `Email not registered`,
  CONFIRM_EMAIL_FIRST = `Please confirm your email first`,
  INVALID_EMAIL = `Invalid email address`,
  INVALID_PASSWORD = `Use 8-15 characters with a mix of letters, numbers & symbols`,
  INVALID_USERNAME = `Invalid user name`,
  INVALID_COUNTRY = `Invalid country name`,
  INVALID_PHONE_NUMBER = `Invalid phone number`,
  INVALID_BINANCE_API = `Invalid binance api key`,
  INVALID_REFERRER = `Referrer does not exist / has no active plan`,
  PURCHASE_PLAN = `Purchase plan from available plans first`,
  BINANCE_SERVER_ERROR = `Binance server error`,
  CHECK_INTERNET_CONNECTION = `Error while sending email please check internet connection`,
  CONTENT_NOT_FOUND = `Content not found`,
}

// some code enums for sending response code in api response
export enum ResponseCode {
  SUCCESS = 200,
  CREATED_SUCCESSFULLY = 201,
  INTERNAL_ERROR = 500,
  NOT_FOUND = 404,
  CONTENT_NOT_FOUND = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  ALREADY_EXIST = 409,
}

export enum LoggerMessages {
  API_CALLED = `Api Has Been Called.`,
}

export enum NodeEnv {
  TEST = 'test',
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
}
