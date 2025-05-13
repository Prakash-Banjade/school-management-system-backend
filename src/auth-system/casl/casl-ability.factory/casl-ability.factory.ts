import { AbilityBuilder, ExtractSubjectType, InferSubjects, MongoAbility, createMongoAbility } from "@casl/ability";
import { Injectable } from "@nestjs/common";
import { User } from "src/auth-system/users/entities/user.entity";
import { Action, AuthUser, Role } from "src/common/types/global.type";

export type Subjects = InferSubjects<typeof User | Role>

export type AppAbility = MongoAbility<[Action, Subjects]>

@Injectable()
export class CaslAbilityFactory {
    defineAbility(user: AuthUser) {
        const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility)

        if (user.role === Role.SUPER_ADMIN) {
            can(Action.MANAGE, Role.SUPER_ADMIN)
            can(Action.MANAGE, Role.ADMIN)
            can(Action.MANAGE, Role.USER)
        }
        if (user.role === Role.ADMIN) {
            can(Action.MANAGE, Role.ADMIN)
            can(Action.MANAGE, Role.USER)
        }
        else if (user.role === Role.STUDENT) {
            can(Action.MANAGE, Role.USER)
            can(Action.MANAGE, Role.STUDENT)
        } else if (user.role === Role.TEACHER) {
            can(Action.MANAGE, Role.USER)
            can(Action.MANAGE, Role.TEACHER)
        }

        return build({
            detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
        })
    }
}