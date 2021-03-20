import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Modal } from '../../modals/modal';
import { AppointmentService } from '../../services/appointment.service';
import { CalendarEvent, CalendarEventAction } from 'angular-calendar';
import { Subject } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';

interface calEventX extends CalendarEvent {
  id: string,
  professor: string,
  professorID: string,
  student: string,
  studentID: string,
  location: string,
  duration: number,
  studentEmail: string,
  facultyEmail: string,
}

@Component({
  selector: 'app-view-appointment',
  templateUrl: './view-appointment.component.html',
  styleUrls: ['./view-appointment.component.css']
})
export class ViewAppointmentComponent implements OnInit {

  constructor(public dialog: MatDialog, public aptSrv: AppointmentService, public authSrv: AuthService) { }

  events: calEventX[] = [];
  data: any;
  actions: CalendarEventAction[] = [];
  childNotifier : Subject<any> = new Subject<any>();
  userType: string;
  studentID: string = null;
  facultyID: string = null;
  aptDetails: any[] = [];

  ngOnInit() {
    const u = this.authSrv.getUser();
    this.userType = this.authSrv.getType();
    const aptData: any = {};
    if ('StudentID' in u && this.userType === "student") {
      this.studentID = u.StudentID;
      aptData.StudentID = u.StudentID;
    } else if ('FacultyID' in u && this.userType === "faculty") {
      this.facultyID = u.FacultyID;
      aptData.FacultyID = u.StudentID;
    }
    if (Object.keys(aptData).length === 0) {
      return;
    }

    this.aptSrv.getAppointments(aptData).subscribe(data => {
        this.data = data;
        if ('appointments' in data) {
            //if array and if length > 1 
            for (const apt of this.data.appointments) {
                if (!apt.StudentID) {
                  continue;
                }
                let st = new Date(apt.StartTime);
                //st.setHours(st.getHours() + st.getTimezoneOffset()/60);
                let endTime = new Date(st);
                endTime.setMinutes(endTime.getMinutes() + (apt.Duration * 60));
                const loc = apt.Location.trim() ? apt.Location.trim() : "(unspecified)"
                this.events.push({
                    start: st,
                    end: endTime,
                    title: 'Room '+apt.Location,
                    actions: this.actions,
                    id: apt.ID,
                    professor: apt.FacultyLastName + ", " + apt.FacultyFirstName,
                    professorID: apt.FacultyID,
                    student: apt.StudentLastName + ", " + apt.StudentFirstName,
                    studentID: apt.StudentID,
                    location: loc,
                    duration: (apt.Duration * 60),
                    studentEmail: apt.StudentEmail,
                    facultyEmail: apt.FacultyEmail
                });
                this.aptDetails.push({
                    start: this.aptSrv.fmtDate(st),
                    end: this.aptSrv.fmtDate(endTime),
                    id: apt.ID,
                    professor: apt.FacultyLastName + ", " + apt.FacultyFirstName,
                    professorID: apt.FacultyID,
                    student: apt.StudentLastName + ", " + apt.StudentFirstName,
                    studentID: apt.StudentID,
                    location: loc,
                    duration: (apt.Duration * 60),
                    studentEmail: apt.StudentEmail,
                    facultyEmail: apt.FacultyEmail
                });
            }
        }
        this.childNotifier.next(null);
    });
}

eventClicked(args: any): void {
  if ('event' in args) {
    this.data = args.event;
    let st = this.aptSrv.fmtDate(this.data.start);
    let et = this.aptSrv.fmtDate(this.data.end);
    this.dialog.open(Modal, {
        data: {
            start: st,
            end: et,
            title: "Appointment",
            faculty: this.data.professor,
            student: this.data.student,
            status: (this.data.student ? "Scheduled" : "Available"),
            location: this.data.location ? this.data.location : "(unspecified)",
            view: 'view'
        }
    });
  }
}

cancelAppointment(id) {
  if (!id) {
    return alert("Unable to cancel appointment at this time.");
  }
  let event = null; 
  for (const evt of this.events) {
    if (evt.id === id) {
      event = evt;
      break;
    }
  }
  if (!event) {
    return alert("Unable to cancel appointment at this time.");
  }

  let st = this.aptSrv.fmtDate(event.start);
  let et = this.aptSrv.fmtDate(event.end);
  const dialogRef = this.dialog.open(Modal, {
      data: {
          start: st,
          end: et,
          title: "Appointment",
          faculty: event.professor,
          location: event.location ? event.location : "(unspecified)",
          view: 'cancel'
      }
  });
  dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.aptSrv.cancelAppointment(id).subscribe(data => {
          //remove from event array
          this.events = this.events.filter((evt) => {
            return id !== evt.id;
          });
          this.aptDetails = this.aptDetails.filter(evt => {
            return id !== evt.id;
          });

          //refresh table
          this.childNotifier.next(null);

          alert("Successfully Cancelled appointment");
        });
      }
  });
}

}
