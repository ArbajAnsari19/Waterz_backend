import { Request, Response } from "express";
import BookingService from "../services/bookingService";


export class BookingController {
    
    static async createBooking(req: Request, res: Response): Promise<void> {
        try {
            const BookingDetails = {
                startDate: req.body.startDate,
                startTime: req.body.startTime,
                duration: req.body.duration,
                location: req.body.location,
                PeopleNo: req.body.PeopleNo,
                sailingTime : req.body.sailingTime,
                stillTime: req.body.stillTime,
                specialEvent: req.body.specialEvent,
                specialRequest: req.body.specialRequest,
                user: req.currentUser.id,
                yacht: req.params.id
            }
            const { booking, orderId } = await BookingService.createBooking(BookingDetails);
            res.status(201).json({ message: 'Booking created successfully. Please complete the payment.', booking, orderId });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    static async serchIdealYatchs(req: Request, res: Response): Promise<void> {
        try {
            const { startDate, startTime, duration, location, YachtType, capacity } = req.body;
            const filterDeatils = { startDate, startTime, duration, location, YachtType, capacity};
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
                duration: req.body.duration,
                location: req.body.location,
                PeopleNo: req.body.PeopleNo,
                sailingTime : req.body.sailingTime,
                stillTime: req.body.stillTime,
                specialEvent: req.body.specialEvent,
                specialRequest: req.body.specialRequest,
                user: req.currentUser.id,
                customerName: req.body.customerName,
                customerPhone: req.body.customerPhone,
                customerEmail: req.body.customerEmail,
                noOfYatchs: req.body.noOfYatchs,
                yacht: req.params.id
            }
            const { booking, orderId } = await BookingService.createBooking(BookingDetails);
            res.status(201).json({ message: 'Booking created successfully. Please complete the payment.', booking, orderId });
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

}


export default BookingController;