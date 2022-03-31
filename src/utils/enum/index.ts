export enum ResponseMessage {
  SUCCESS = `Success`,
  CREATED_SUCCESSFULLY = `Created successfully`,
  CONTENT_NOT_FOUND = `Content not found`,
  
  CONFIRAMATION_EMAIL_SENT = `Email has been sent to you for verification, Kindly verify your email to get access to the system.`,
  EMAIL_CONFIRMED = `Email Confirmed Successfully`,
  EMAIL_LINK_EXPIRED = `This email link has been expired`,
  FORGOT_PASSWORD_EMAIL = `Please Check Your Email To Reset Password`,
  RESET_PASSWORD_LINK_EXPIRED = `This Reset Password Link Has Been Expied`,
  DOES_NOT_EXIST = `Does Not Exist`,
  EMAIL_NOT_REGISTERED = `Email not registered`,
  EMAIL_QUERY_PARAM_MISSING = `non optional param 'email' missing`,
  CONFIRM_EMAIL_FIRST = `Please confirm your email first`,
  
  PAYMENT_ALREADY_CANCELLED = `Requested Payment is already cancelled`,
  PAYMENT_ALREADY_PAID = `Requested Payment is already Paid`,
  DEPOSIT_RECOVERY_PROCESS_STARTED = `Deposit Recovery Routine started`,
  DEPOSIT_RECOVERY_PROCESS_ERROR = `Deposit Recovery Routine Failed`,
  BONUS_TRANSACTION_ERROR = `Bonus transaction failed`,
  ERROR_WHILE_DISTRIBUTING_BONUS = `Error While Distributing The Bonus`,
  ERROR_WHILE_DEPOSIT = `Error While Confirming Deposit Amount`,
 
  INVALID_QUERY_PARAM = `Invalid query parameter`,
  IS_INVALID = `Is Invalid`,
  INVALID_PAYMENT_ID = `Invalid paymentId`,
  USER_ALREADY_EXISTS = `User with the same email already exists`,
  USER_DOES_NOT_EXIST = `User with specified email does not exists`,
  INVALID_USERNAME_OR_PASSWORD = `Invalid email or password`,
  USERNAME_ALREADY_TAKEN = `User with the same username already exists, please try another one.`,
  
  INVALID_EMAIL = `Invalid email address`,
  INVALID_PASSWORD = `Invalid Password. Use 8-15 characters with a mix of letters, numbers & symbols`,
  INVALID_USERNAME = `Invalid user name`,
  INVALID_NAME = `Invalid name`,
  INVALID_COUNTRY = `Invalid country name`,
  INVALID_PHONE_NUMBER = `Invalid phone number`,
  INVALID_BINANCE_API = `Invalid binance api key`,
  INVALID_REFERRER = `Referrer does not exist / has no active plan`,
 
  PURCHASE_PLAN = `Purchase plan from available plans first`,
  BINANCE_SERVER_ERROR = `Binance server error`,
  INTERNAL_SERVER_ERROR = `Internal server error`,
  CHECK_INTERNET_CONNECTION = `Error while sending email please check internet connection`,
  UNABLE_TO_PING_COINMARKET = `Unable to ping coin-gecko market`,
  
  VERIFICATION_CODE_SEND = `Email has been sent successfully`,
  VERIFICATION_DONE = `Verification Completed`,
  INVALID_KLAYTN_ADDRESS = `Invalid Wallet Address`,
  INVALID_VERIFICATION_CODE = `Invalid verification code`,
  PROFILE_UPDATED_SUCCESSFULLY = `Profile updated successfully`,
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

export enum TelergramBotMessages {
  ALREADY_ACTIVATED = `You Have <b>Already Activated</b> Binance Plus Notifications`,
  SUCCCESSFULLY_ACTIVATED = `You Have <b>Successfully Activated</b> Binance Plus Notifications`,
  ACTIVATE_FIRST = `<b>Activate</b> Binance Plus Notifications <b>First</b>`,
  SUCCCESSFULLY_DEACTIVATED = `You Have <b>Successfully Deactivated</b> Binance Plus Notifications`,
}

export enum NodeEnv {
  TEST = 'test',
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
}

export enum JOB {
  MARKET_PRICE = `market price`,
  RECOVER_DEPOSIT = `recover deposits`,
  EXPIRE_PAYMENT = `expire payment`,
  WALLET_SYNC = `wallet sync`,
}

export enum BlockProcess {
  PROCESS_COMPLETED= `Block Processing Completed`
}
