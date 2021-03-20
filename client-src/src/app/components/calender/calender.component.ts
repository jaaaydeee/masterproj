    //CalenderComponent
    import {
        ChangeDetectionStrategy,
        Component,
        ViewEncapsulation
    } from '@angular/core';
    import { CalendarEvent, CalendarView, CalendarWeekViewBeforeRenderEvent, CalendarEventAction } from 'angular-calendar';
    import { WeekViewHourColumn } from 'calendar-utils';
    import { MatDialog } from '@angular/material/dialog';
    import { Modal } from '../../modals/modal';
    import { AppointmentService } from '../../services/appointment.service';
    import { AuthService } from '../../services/auth.service';
    import { Router } from '@angular/router';
    import { Subject } from 'rxjs';

    // todo: make 1 file to hold all reusable interfaces
    interface calEventX extends CalendarEvent {
        id: string,
        professor: string,
        student: string,
        location: string,
        duration: number
    }

    interface User {
        email: string,
        StudentID: string,
        FacultyID: string,
        FirstName: string,
        Lastname: string
    }

    const colors: any = {
        red: {
          primary: '#ad2121',
          secondary: '#FAE3E3'
        },
        blue: {
          primary: '#1e90ff',
          secondary: '#D1E8FF'
        },
        yellow: {
          primary: '#e3bc08',
          secondary: '#FDF1BA'
        }
    };

    @Component({
        selector: 'add-availability',
        changeDetection: ChangeDetectionStrategy.OnPush,
        templateUrl: './calender.component.html',
        styleUrls: ['./calender.component.css'],
        encapsulation: ViewEncapsulation.None,
    })
    export class CalenderComponent {

    constructor(
        public dialog: MatDialog, 
        public aptSrv: AppointmentService, 
        public authSrv: AuthService,
        private router:Router
        ) {}

    view: CalendarView = CalendarView.Week;
    viewDate: Date = new Date();
    hourBlock: Number = 2;
    events: calEventX[] = [];
    clickedEvent: calEventX;
    refresh: Subject<any> = new Subject();
    data: any;
    appointmentsTotal: number;
    appointmentsScheduledTotal: number;
    hourColumns: WeekViewHourColumn[];
    facultyID: string = "";
    clickedDate: Date;
    selectedDayViewDate: Date;
    aptDates: Date[] = new Array();
    aptDatesSet = new Set();
    canceledDates: any[] = [];
    canceledDatesSet = new Set();
    clickedColumn: number;
    actions: CalendarEventAction[] = [
        {
            label: '<i class="fa fa-fw fa-times"></i>',
            onClick: ({ event }: { event: CalendarEvent }): void => {  
                this.canceledDates.push(event);
                const dt = event.start.getTime();
                this.canceledDatesSet.add(dt);
                this.data = event;
                if ('duration' in this.data && this.data.duration == "1.00") {
                    this.canceledDatesSet.add(new Date(dt + 1800000).getTime()); //30 mins to ms
                }
                this.events = this.events.filter(e => e !== event);
            }
        }
    ];

    ngOnInit() {
        //get faculty ID
        const u = this.authSrv.getUser();
        if ('FacultyID' in u && u.FacultyID) {
            this.facultyID = u.FacultyID;
        } else {
            this.router.navigate(['/']);
            return;
        }

        if (this.facultyID) {
            this.aptSrv.getAppointments({
                FacultyID: this.facultyID
            }).subscribe(data => {
                this.appointmentsScheduledTotal = 0;
                this.appointmentsTotal = 0;

                this.data = data;
                if ('appointments' in data) {
                    for (const apt of this.data.appointments) {
                        let color = colors.yellow;
                        if (apt.Status === 'Scheduled') {
                            color = colors.blue;
                            this.appointmentsScheduledTotal++;
                        }
                        this.appointmentsTotal++;

                        let st = new Date(apt.StartTime);
                        //st.setHours(st.getHours() + st.getTimezoneOffset()/60);
                        let endTime = new Date(st);
                        endTime.setMinutes(endTime.getMinutes() + (apt.Duration * 60));
                        this.events.push({
                            start: new Date(st),
                            end: endTime,
                            title: " ID# "+apt.ID+', Room '+apt.Location,
                            color: color,
                            actions: this.actions,
                            id: apt.ID,
                            professor: apt.FacultyID,
                            student: apt.StudentID,
                            location: apt.Location.trim(),
                            duration: apt.Duration
                        });
                    }
                }
                this.refresh.next();
            });
        }
    }

    eventClicked({ event }: { event: CalendarEvent }): void {
        this.data = event;
        let st = this.aptSrv.fmtDate(this.data.start);
        let et = this.aptSrv.fmtDate(this.data.end);
        this.dialog.open(Modal, {
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

    beforeWeekOrDayViewRender(event: CalendarWeekViewBeforeRenderEvent) {
        this.hourColumns = event.hourColumns;
        this.addSelectedDayViewClass();
    }

    hourSegmentClicked(date: Date) {
        const dt = date.getTime();
        if (dt > Date.now()) {
            if (this.aptDatesSet.has(dt)) {
                this.aptDatesSet.delete(dt);
            } else if (!this.canceledDatesSet.has(dt)) {
                this.aptDatesSet.add(dt);
            }

            // draw selections 
            this.selectedDayViewDate = date;
            this.addSelectedDayViewClass();
            this.aptDates.push(date);
        } else {
            console.log("Invalid date time");
        }
    }

    onSubmit() {
        let aptStr: string[] = [];
        for (const apt of Array.from(this.aptDatesSet)) {
            const d = new Date(parseInt(<string>apt));
            let s = this.aptSrv.fmtAppointment(d, (this.hourBlock == 1 ? 60 : 30));
            aptStr.push(s);
        }

        const dialogRef = this.dialog.open(Modal, {
            data: {
                view: 'make',
                appointments: aptStr,
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            //post
            if (result) {
                const room = typeof result.room !== "undefined" && result.room ? result.room : "";
                this.aptSrv.postAvailability(this.aptDatesSet, this.canceledDates, this.facultyID, (this.hourBlock == 1 ? 1.0 : 0.5), room).subscribe(data => {
                    if (data.success) {
                        this.events = [];
                        this.canceledDates = [];
                        this.aptDatesSet.clear();
                        this.canceledDatesSet.clear();
                        this.appointmentsScheduledTotal = 0;
                        this.appointmentsTotal = 0;
                    }

                    this.aptSrv.getAppointments({
                        FacultyID: this.facultyID
                    }).subscribe(data => {
                        this.data = data;
                        if ('appointments' in data) {
                            //if array and if length > 1 
                            for (const apt of this.data.appointments) {
                                let color = colors.yellow;
                                if (apt.Status === 'Scheduled') {
                                    color = colors.blue;
                                    this.appointmentsScheduledTotal++;
                                }
                                this.appointmentsTotal++;
                                
                                let st = new Date(apt.StartTime);
                                //st.setHours(st.getHours() + st.getTimezoneOffset()/60);
                                let endTime = new Date(st);
                                endTime.setMinutes(endTime.getMinutes() + (apt.Duration * 60));
                                this.events.push({
                                    start: st,
                                    end: endTime,
                                    title: 'Room '+apt.Location,
                                    color: color,
                                    actions: this.actions,
                                    id: apt.ID,
                                    professor: apt.FacultyID,
                                    student: apt.StudentID,
                                    location: apt.Location.trim(),
                                    duration: apt.Duration
                                });
                            }
                        }
                    this.refresh.next();
                    });
                });
            }
        });
    }

    private addSelectedDayViewClass() {
        this.hourColumns.forEach((column) => {
            column.hours.forEach((hourSegment) => {
                hourSegment.segments.forEach((segment) => {
                    delete segment.cssClass;
                    
                    if (this.aptDatesSet.has(segment.date.getTime())) {
                        segment.cssClass = 'cal-day-selected';
                    }

                    //part of deleted group
                    if (this.canceledDatesSet.has(segment.date.getTime())) {
                        segment.cssClass = 'cal-event-removed';
                    }
                });
            });
        });
    }
}
