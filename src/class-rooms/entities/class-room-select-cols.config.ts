export const classRoomsColumnsConfig = {
    id: true,
    name: true,
    monthlyTutionFee: true,
    monthlyFee: true,
    location: true,
    createdAt: true,
    classRoomParentClass: {
        id: true,
        name: true,
        classType: true,
        // parentClass: {
        //     id: true,
        //     name: true,
        //     classType: true,
        // },
    },
    childrenClasses: {
        id: true,
        name: true,
        classType: true
    },
    classType: true,
}
