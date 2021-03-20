const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const user_model = require('../models/User_model');
const appointment_model = require('../models/Appointment_model');

router.post('/register', (req, res, next) => {
    if (typeof req.body.Email === "undefined" ||
        typeof req.body.FirstName === "undefined" ||
        typeof req.body.LastName === "undefined" ||
        typeof req.body.Password === "undefined" &&
        !(typeof req.body.StudentID === "undefined" || typeof req.body.FacultyID === "undefined")
    ) {
        return res.json({success: false, msg: 'Unable to register user, incorrect parameters'});
    }

    const user = {
        "Email": req.body.Email,
        "FirstName": req.body.FirstName,
        "LastName": req.body.LastName,
        "Password": req.body.Password
    };
    if (typeof req.body.FacultyID !== "undefined" && req.body.FacultyID) {
        user.FacultyID = req.body.FacultyID;
    } else {
        user.StudentID = req.body.StudentID;
    }
    user_model.registerUser(user, (row, err) => {
        if (err) {
            res.json({success: false, msg: 'Unable to register user'});
        } else {
            res.json({success: true, msg: 'User registed.', user: row});
        }
    });
});

router.post('/auth', (req, res, next) => {
    if (typeof req.body.Email !== "undefined" && typeof req.body.Password !== "undefined") {
        user_model.validateUser(req.body.Email, req.body.Password, (user, jwt, err) => {
            if (user, jwt) {
                res.json({success: true, user: user, token: jwt, msg: 'User Validated!'});
            } else {
                res.json({success: false, msg: 'Incorrect username or password', error: err});
            }
        });
    } else {
        res.json({success: false, msg: 'Missing Required validation fields'});
    }
});

// only professors create appointments
/*
{
    "FacultyID":"999999999",
    "Location": "Room 102",
    "StartTime": "2021-02-07 14:30",
    "Duration": "0.5"
}
*/
router.post('/createAppointment', (req, res, next) => {
    if (typeof req.body.FacultyID !== "undefined" && 
        typeof req.body.Location !== "undefined" && 
        typeof req.body.StartTime !== "undefined" && 
        typeof req.body.Duration !== "undefined"
        ) {
            let newApt = {
                FacultyID: req.body.FacultyID,
                Location: req.body.Location, 
                StartTime: req.body.StartTime,
                Duration: req.body.Duration
            };
            appointment_model.addAppointment(newApt, (apt, err) => {
            if (apt) {
                //may have to trim white space for some stuff
                res.json({success: true, appointment: apt, msg: 'Appointment Created'});
            } else {
                res.json({success: false, msg: 'Error'});
            }
        });
    } else {
        res.json({success: false, msg: 'Missing required request fields.'});
    }
});

//you can build the curl testing later or document postman
router.post('/createAppointments', (req, res, next) => {
    let Appointments = [];
    let updateAppointments = [];
    let error = [];
    for (const key in req.body) {
        if (req.body.hasOwnProperty(key)) {
            let value = req.body[key];
            // you will go off of jwt in the future
            if ((typeof value.FacultyID === "undefined" && value.FacultyID) || 
                (typeof value.Location === "undefined" && value.Location) || 
                (typeof value.StartTime === "undefined" && value.StartTime) || 
                (typeof value.Duration === "undefined" && value.Duration)
            ) {
                error.push(value);
                continue;
            }
            const newApt = {
                FacultyID: value.FacultyID,
                Location: value.Location, 
                StartTime: value.StartTime,
                Duration: value.Duration
            };
            if ('ID' in value) {
                //typeof value.FacultyID === "undefined"
                newApt.ID = value.ID;
                updateAppointments.push(newApt);
            } else {
                Appointments.push(newApt);
            }
        }
    }
    if (error.length || (Appointments.length == 0 && updateAppointments.length == 0)) {
        return res.json({success: false, msg: 'Bad input data.', error: error});
    }

    appointment_model.updateAppointments(updateAppointments, "Removed", (apts, err) => {

        appointment_model.addAppointments(Appointments, (apts, err) => {
            if (apts) {
                res.json({success: true, appointment: apts, msg: 'Appointments Created'});
            } else {
                res.json({success: false, msg: 'Database error', error: err});
            }
        });
    });
});

router.post('/setAppointment', (req, res, next) => {
    if (typeof req.body.StudentID === "undefined" || typeof req.body.AppointmentID === "undefined") {
        return res.json({success: false, msg: 'Bad input data.', error: "error"});
    }
    let filter = {
        id: req.body.AppointmentID,
        open: true
    };
    appointment_model.getAppointments(filter, (apts, err) => {
        if (apts) {
            appointment_model.setAppointment(req.body.AppointmentID, req.body.StudentID, (apt, err) => {
                if (apt) {
                    res.json({success: true, appointment: apt, msg: 'Successfully made appointment'});
                } else {
                    res.json({success: false, msg: 'Database error', error: err});
                }
            });
        } else {
            return res.json({success: false, msg: 'Appointment unavailable.', error: error});
        }
    });
});

router.post('/getAppointments', (req, res, next) => {
    let filter = [];
    if (typeof req.body.StartTime !== "undefined" && typeof req.body.EndTime !== "undefined") {
        filter.push({dateRange: [req.body.StartTime, req.body.EndTime]});
    }
    if (typeof req.body.StudentID !== "undefined") {
        filter.studentID = req.body.StudentID;
    }
    if (typeof req.body.FacultyID !== "undefined") {
        filter.facultyID = req.body.FacultyID;
    }
    if (typeof req.body.Date !== "undefined") {
        filter.date = req.body.Date;
    }
    if (typeof req.body.Open !== "undefined") {
        filter.open = req.body.Open;
    }

    appointment_model.getAppointments(filter, (apts, err) => {
        if (apts) {
            res.json({success: true, appointments: apts});
        } else {
            res.json({success: false, msg: 'Database error', error: err});
        }
    });
});

router.post('/cancelAppointment', (req, res, next) => {
    if (typeof req.body.AppointmentID === "undefined") {
        return res.json({success: false, msg: "Bad input data.", error: "error"});
    }   

    appointment_model.cancelAppointment(req.body.AppointmentID, (status, err) => {
        if (status) {
            return res.json({success: true, message: "Successfully canceled appointment."});
        } else {
            return res.json({success: true, message: "Unable to cancel appointment at this time. If issue persist please contact support.", error: err});
        }
    });
});

router.post('/faculty', (req, res) => {
    user_model.getFaculty((faculty, err) => {
        if (faculty) {
            res.json({success: true, faculty: faculty});
        } else {
            res.json({success: false, msg: 'Database error', error: err});
        }
    });
});

module.exports = router;
