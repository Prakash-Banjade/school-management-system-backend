import { FindOptionsSelect } from "typeorm";
import { Account } from "../entities/account.entity";

export const accountSelectCols: FindOptionsSelect<Account> = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    createdAt: true,
    updatedAt: true,
};