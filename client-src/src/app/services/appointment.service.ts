import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class AppointmentService {

    constructor(private http:HttpClient) { }
    base_url: string = window.location.origin;

    fmtAppointment(date:Date, duration:number) : string {
        let date2 = new Date(date);
        date2.setMinutes(date.getMinutes() + duration);
        let s: string = date.toLocaleString('en-US') + " - " + date2.toLocaleString('en-US');
        let d: string = (duration == 60) ? " (1hr)" : " (30mins)";
        s += d;

        return s;
    }

    fmtDate(date:Date, type:string="") : string {
        let y = date.getFullYear();
        let mo = date.getMonth() + 1;
        let d = date.getDate();
        let h = date.getHours();
        let mi = date.getMinutes();
        let mins = "";
        let ampm = "";
        if (h > 12) {
            h -= 12;
            ampm = "PM";
        } else {
            ampm = "AM";
        }
        if (mi < 10) {
            mins = "0" + mi;
        } else {
            mins = "" + mi;
        }

        if (type === "date") {
            return`${mo}/${d}/${y}`;
        } else if (type === "time") {
            return `${h}:${mins} ${ampm}`;
        }

        return `${mo}/${d}/${y} ${h}:${mins} ${ampm}`;
    }

    cancelAppointment(aptID) {
        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        };
        const data = {
            AppointmentID: aptID
        };

        return this.http.post(this.base_url+'/api/cancelAppointment', data, httpOptions);
    }

    scheduleAppointment(aptID, studentID) {
        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        };
        const data = {
            AppointmentID: aptID,
            StudentID: studentID
        };

        return this.http.post(this.base_url+'/api/setAppointment', data, httpOptions);
    }

    getAppointments(params) {
        let data:any = {};
        if (typeof params.FacultyID !== "undefined" && params.FacultyID) {
            data.FacultyID = params.FacultyID;
        }
        if (typeof params.StudentID !== "undefined") {
            data.StudentID = params.StudentID;
        }
        if (typeof params.Open !== "undefined" && params.Open) {
            data.Open = params.Open;
        }

        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        };

        return this.http.post(this.base_url+'/api/getAppointments', data, httpOptions);
    }

    postAvailability(dateTimes:Set<any>, removedDT: any[], facultyID:string, duration:Number, room:string): any {
        const token = localStorage.getItem('id_token');
        const user = JSON.parse(localStorage.getItem('user'));
        let apts = [];
        if (typeof user.FacultyID !== "undefined") {
            for (const dt of Array.from(dateTimes.values())) {
                //let date = new Date(dt).toISOString();
                let st = new Date(dt);
                //st.setHours(st.getHours() - st.getTimezoneOffset()/60);
                let date = st.toISOString(); //this adds 8hs?
                apts.push({
                    Location: room,
                    StartTime: date,
                    FacultyID: facultyID,
                    Duration: duration,
                    Token: token
                });
            }
            if (removedDT.length > 0) {
                for (const r of removedDT) {
                    if ('id' in r) {
                        apts.push({
                            ID: r.id,
                            Location: r.location,
                            StartTime: r.start,
                            FacultyID: r.professor,
                            Duration: r.duration
                        });
                    }
                }
            }
        }
        if (apts.length > 0) {
            const httpOptions = {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json'
                })
            };

            return this.http.post(this.base_url+'/api/createAppointments', apts, httpOptions);
        }
    }

    getFaculty() {
        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        };

        return this.http.post(this.base_url+'/api/faculty', {}, httpOptions);
    }
}
