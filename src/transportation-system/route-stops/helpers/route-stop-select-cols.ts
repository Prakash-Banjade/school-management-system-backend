import { FindOptionsSelect } from "typeorm";
import { RouteStop } from "../entities/route-stop.entity";

export const routeStopSelectCols: FindOptionsSelect<RouteStop> = {
    id: true,
    createdAt: true,
    name: true,
    location: true,
    fare: true,
    sequence: true,
    pickUpTime: true,
    dropOffTime: true,
    distance: true,
    vehicle: {
        id: true,
        vehicleNumber: true,
        type: true,
    },
}