import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

/* Calender Stuff */
import { CommonModule } from '@angular/common';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

/*Components*/
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';

/*Services*/
import { ValidateService } from './services/validate.service';
import { AuthService } from './services/auth.service';
import { AppointmentService } from './services/appointment.service';
import { NgFlashMessagesModule } from 'ng-flash-messages';
import { AuthGuard } from './guards/auth.guard';
import { CalenderComponent } from './components/calender/calender.component';
import { CalenderHeaderComponent } from './components/calender-header/calender-header.component';
import { Modal } from './modals/modal';
import { MatDialogModule } from '@angular/material/dialog';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ViewAppointmentComponent } from './components/view-appointment/view-appointment.component';
import { ScheduleAppointmentComponent } from './components/schedule-appointment/schedule-appointment.component';
import { ScheduleComponent } from './components/schedule/schedule.component';
import { HelpComponent } from './components/help/help.component';
import { ForbiddenComponent } from './components/forbidden/forbidden.component';
import { HomeComponent } from './components/home/home.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    ProfileComponent,
    CalenderComponent,
    CalenderHeaderComponent,
    Modal,
    SidebarComponent,
    ViewAppointmentComponent,
    ScheduleAppointmentComponent,
    ScheduleComponent,
    HelpComponent,
    ForbiddenComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    NgFlashMessagesModule.forRoot(),
    CommonModule,
    BrowserAnimationsModule,
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),
    MatDialogModule
  ],
  providers: [ValidateService, AuthService, AuthGuard, AppointmentService],
  bootstrap: [AppComponent],
  entryComponents: [ Modal ]
})
export class AppModule { }
