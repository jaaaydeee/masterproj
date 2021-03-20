import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Modal } from '../../modals/modal';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { CalendarEvent, CalendarEventAction } from 'angular-calendar';
import { Subject } from 'rxjs';

interface calEventX extends CalendarEvent {
  id: string,
  professor: string,
  student: string,
  location: string,
  duration: number
}

interface Faculty {
    FacultyID: string,
    FirstName: string,
    LastName: string
}

interface DateExt {
    eventID: string,
    d: string,
    t: string,
    value: Date
}

@Component({
  selector: 'app-schedule-appointment',
  templateUrl: './schedule-appointment.component.html',
  styleUrls: ['./schedule-appointment.component.css']
})
export class ScheduleAppointmentComponent implements OnInit {

constructor(public dialog: MatDialog, public aptSrv: AppointmentService, public authSrv: AuthService) { }

events: calEventX[] = [];
data: any;
actions: CalendarEventAction[] = [];
availableTimes: string[] = [];
selectedDay: string;
selectedTime: string;
faculty: Faculty[];
selectedFaculty: string = "";
availableDates: DateExt[] = [];
availableDatesSet = new Set();
noApts: boolean = false;
aptDetails: any;
studentID: string;
childNotifier : Subject<any> = new Subject<any>();

ngOnInit() {
    const u = this.authSrv.getUser();
    if ('StudentID' in u) {
        this.studentID = u.StudentID;
    }

    //get available faculty.
    this.aptSrv.getFaculty().subscribe(data => {
        this.data = data;
        this.faculty = [];
        if (this.data.success) {
            for (const f of this.data.faculty) {
                this.faculty.push({
                    FacultyID: f.FacultyID,
                    FirstName: f.FirstName.trim(),
                    LastName: f.LastName.trim()
                });
            }
        }
    });
}

eventClicked(args: any): void {
    if ('event' in args) {
        this.data = args.event;
        let st = this.aptSrv.fmtDate(this.data.start);
        let et = this.aptSrv.fmtDate(this.data.end);
        const dialogRef = this.dialog.open(Modal, {
            data: {
                start: st,
                end: et,
                title: "Appointment",
                status: (this.data.student ? "Scheduled" : "Available"),
                location: this.data.location ? this.data.location : "(unspecified)",
                view: 'view'
            }
        });
    }
}

getAppointments(facultyID) {
    this.aptSrv.getAppointments({
        FacultyID: facultyID,
        Open: true
    }).subscribe(data => {
        this.data = data;
        if ('appointments' in data) {
            for (const apt of this.data.appointments) {
                let st = new Date(apt.StartTime);
                //st.setHours(st.getHours() + st.getTimezoneOffset()/60);
                let endTime = new Date(st);
                endTime.setMinutes(endTime.getMinutes() + (apt.Duration * 60));

                if (st.getTime() <= Date.now()) {
                    continue;
                }

                this.events.push({
                    start: st,
                    end: endTime,
                    title: 'Room '+apt.Location,
                    cssClass: 'cal-event-available',
                    actions: this.actions,
                    id: apt.ID,
                    professor: apt.FacultyID,
                    student: apt.StudentID,
                    location: apt.Location.trim(),
                    duration: (apt.Duration * 60)
                });

                const dateFormated = this.aptSrv.fmtDate(st, "date");
                this.availableDates.push({
                    eventID: apt.ID,
                    d: dateFormated,
                    t: this.aptSrv.fmtDate(st, "time"),
                    value: st
                });
                this.availableDatesSet.add(dateFormated);
            }
            this.childNotifier.next(null);
        }
        if (this.availableDates.length < 1) {
            this.noApts = true;
        }
    });
}

facultyChange() {
    this.noApts = false;
    this.events = [];
    this.availableDates = [];
    this.availableDatesSet.clear();
    this.availableTimes = [];
    this.selectedDay = "";
    this.selectedTime = "";
    this.aptDetails = [];
    if (this.selectedFaculty) {
        this.getAppointments(this.selectedFaculty);
    }
}

dateChange() {
    this.availableTimes = [];
    this.selectedTime = "";
    for (const dt of this.availableDates) {
        if (this.selectedDay === dt.d) {
            this.availableTimes.push(dt.t);
        }
    }
    this.loadAvailableApts();
}

timeChange() {
    this.loadAvailableApts();
}

loadAvailableApts() {
    let apts = [];
    let instructor = "";
    for (const f of this.faculty) {
        if (this.selectedFaculty === f.FacultyID) {
            instructor = f.LastName + ", " + f.FirstName;
            break;
        }
    }

    for (const apt of this.availableDates) {
        if (apt.d === this.selectedDay) {
            console.log(this.selectedTime);
            console.log(apt.t);
            if (this.selectedTime && this.selectedTime !== apt.t) {
                continue;
            }

            let eventX: calEventX;
            for (const evt of this.events) {
                if (apt.eventID === evt.id) {
                    eventX = evt;
                    break;
                }
            }
            if (eventX) {
                const objX = {
                    location: eventX.location ? eventX.location : "(unspecified)",
                    start: this.aptSrv.fmtDate(eventX.start),
                    end: this.aptSrv.fmtDate(eventX.end),
                    faculty: instructor,
                    duration: eventX.duration,
                    id: eventX.id,
                    date: apt.d,
                    startTime: apt.t,
                };
                apts.push(objX);
                //this.refresh.next();
            }
        }
    }
    this.aptDetails = apts;
}

scheduleApt(aptId) {
    let event;
    for (const ev of this.events) {
        if (aptId === ev.id) {
            event = ev;
            break;
        }
    }
    if (event) {
        let st = this.aptSrv.fmtDate(event.start);
        let et = this.aptSrv.fmtDate(event.end);
        const dialogRef = this.dialog.open(Modal, {
            data: {
                start: st,
                end: et,
                title: "Appointment",
                status: (event.student ? "Scheduled" : "Available"),
                location: event.location ? event.location : "(unspecified)",
                view: 'schedule'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.schedule(aptId); //or event.id
            }
        });
    }
}

schedule(id) {
    if (id) {
        this.aptSrv.scheduleAppointment(id, this.studentID).subscribe(data => {
            this.data = data;
            if (this.data.success) {
                alert(this.data.msg);
                this.events = this.events.filter((evt) => {
                    return id !== evt.id;
                });
                this.aptDetails = this.aptDetails.filter((apt) => {
                    return id !== apt.id;
                });
            } else {
                alert("No luck, try again later?");
            }
        });
    }
}

}
