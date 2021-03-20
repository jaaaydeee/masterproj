import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  Input,
  OnInit
} from '@angular/core';
import { CalendarEvent, CalendarView } from 'angular-calendar';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { Modal } from '../../modals/modal';
import { AppointmentService } from 'src/app/services/appointment.service';

interface calEventX extends CalendarEvent {
  id: string,
  professor: string,
  student: string,
  location: string,
}

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class ScheduleComponent {

  constructor(public dialog: MatDialog, public aptSrv: AppointmentService) { }

  @Input() notifier: Subject<any>;
  @Input() eventClicked: (args: any) => void;
  @Input() events: calEventX[] = [];

  view: CalendarView = CalendarView.Week;
  viewDate: Date = new Date();
  hourBlock: Number = 2;
  refresh: Subject<any> = new Subject();

  ngOnInit() {
    this.notifier.subscribe(data => {
      this.refreshView();
    });
  }

  refreshView(): void {
    this.refresh.next();
  }

  beforeWeekOrDayViewRender() {
  }  
}
