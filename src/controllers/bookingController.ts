import { Request, Response } from "express";
import BookingService from "../services/bookingService";
import { PackageType } from "../utils/trip";


export class BookingController {

    static async getTripOptions(req: Request, res: Response): Promise<void> {
        try {
          res.status(200).json({ tripOptions: PackageType });
        } catch (error) {
          res.status(500).json({ message: (error as Error).message });
        }
    }
    
    static async createBooking(req: Request, res: Response): Promise<void> {
        try {
            const BookingDetails = {
                startDate: req.body.startDate,
                startTime: req.body.startTime,
                location: req.body.location,
                PeopleNo: req.body.PeopleNo,
                packages : req.body.packages,
                addonServices: req.body.addonServices,
                user: req.currentUser.id,
                promoCode: req.body.promoCode,
                yacht: req.params.id
            }
            const role = req.currentUser.role;
            const { booking, orderId } = await BookingService.createBooking(BookingDetails,role);
            res.status(201).json({ message: 'Booking created successfully. Please complete the payment.', booking, orderId });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async serchIdealYatchs(req: Request, res: Response): Promise<void> {
        try {
            const { startDate, startTime, location, YachtType, capacity, PeopleNo, addonServices,packages } = req.body;
            const filterDeatils = { startDate, startTime, location, YachtType, capacity, PeopleNo, addonServices,packages};
            const yatches =await BookingService.searchIdealYachts(filterDeatils);
            res.status(200).json({ yatches });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
    }
    }

    static async createAgentBooking(req: Request, res: Response): Promise<void> {
        try {
            const BookingDetails = {
                startDate: req.body.startDate,
                startTime: req.body.startTime,
                location: req.body.location,
                PeopleNo: req.body.PeopleNo,
                user: req.currentUser.id,
                yacht: req.params.id
            }
            const customerData = {
                customerName: req.body.customerName,
                customerPhone: req.body.customerPhone,
                customerEmail: req.body.customerEmail
            }
            const { booking, orderId } = await BookingService.createAgentBooking(BookingDetails,customerData);
            res.status(201).json({ message: 'Booking created successfully. Please complete the payment.', booking, orderId });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    // static async createAgentBookingWithMultipleYatchs(req: Request, res: Response): Promise<void> {
    //     try {
    //         const BookingDetails = {
    //             startDate: req.body.startDate,
    //             startTime: req.body.startTime,
    //             location: req.body.location,
    //             PeopleNo: req.body.PeopleNo,
    //             user: req.currentUser.id,
    //             noOfYatchs: req.body.noOfYatchs,
    //             yacht: req.params.id,
    //             customerName: req.body.customerName,
    //             customerPhone: req.body.customerPhone,
    //             customerEmail: req.body.customerEmail
    //         }
    //         const { booking, orderId } = await BookingService.createAgentMultipleBooking(BookingDetails);
    //         res.status(201).json({ message: 'Booking created successfully. Please complete the payment.', booking, orderId });
    //     } catch (error) {
    //         res.status(500).json({ message: (error as Error).message });
    //     }
    // }
}
export default BookingController;