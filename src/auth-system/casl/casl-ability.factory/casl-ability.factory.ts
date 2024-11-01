import { AbilityBuilder, ExtractSubjectType, InferSubjects, MongoAbility, createMongoAbility } from "@casl/ability";
import { Injectable } from "@nestjs/common";
import { User } from "src/auth-system/users/entities/user.entity";
import { Action, AuthUser, Role } from "src/common/types/global.type";

export type Subjects = InferSubjects<typeof User> | 'all' | Role;

export type AppAbility = MongoAbility<[Action, Subjects]>

@Injectable()
export class CaslAbilityFactory {
    defineAbility(user: AuthUser) {
        const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility)

        if (user.role === Role.ADMIN) {
            can(Action.MANAGE, 'all')
            cannot(Action.MANAGE, Role.STUDENT)
        }
        else if (user.role === Role.MODERATOR) {
            can(Action.READ, 'all')
            can(Action.CREATE, 'all')
            can(Action.UPDATE, 'all')
            cannot(Action.DELETE, 'all').because('Access Denied')
        } else if (user.role === Role.STUDENT) {
            can(Action.MANAGE, Role.STUDENT)
        } else if (user.role === Role.USER) {
            cannot(Action.READ, 'all').because('Access Denied')
            can(Action.READ, User)
            cannot(Action.RESTORE, 'all').because('Access Denied')
            cannot(Action.CREATE, 'all').because('Access Denied')
            can(Action.CREATE, User)
            cannot(Action.UPDATE, 'all').because('Access Denied')
            can(Action.UPDATE, User)
            cannot(Action.DELETE, 'all').because('Access Denied')
            can(Action.DELETE, User)
        }

        return build({
            detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
        })
    }
}