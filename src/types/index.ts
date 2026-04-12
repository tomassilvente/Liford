export type {
  WalletModel as Wallet,
  ForeignAccountModel as ForeignAccount,
  InvestmentModel as Investment,
  TransactionModel as Transaction,
  ClientModel as Client,
  SessionModel as Session,
} from "@/generated/prisma/models";

export {
  Currency,
  TransactionType,
  TransactionSource,
  InvestmentType,
  SessionType,
  SessionStatus,
} from "@/generated/prisma/enums";
