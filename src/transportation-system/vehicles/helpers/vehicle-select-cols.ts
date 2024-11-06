import { FindOptionsSelect } from "typeorm";
import { Vehicle } from "../entities/vehicle.entity";

export const vehicleSelectCols: FindOptionsSelect<Vehicle> = {
    id: true,
    createdAt: true,
    vehicleNumber: true,
    vehicleModel: true,
    capacity: true,
    yearMade: true,
    type: true,
    note: true,
    driver: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        type: true,
    },
}