import { Component } from '@angular/core';
import { ValidateService } from '../../services/validate.service';
import { NgFlashMessageService } from 'ng-flash-messages';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  firstname: string;
  lastname: string;
  id: number;
  type: string;
  password: string;
  email: string;
  data:any;

  constructor(
    private validateService: ValidateService, 
    private ngFlashMessageService: NgFlashMessageService,
    private authService:AuthService,
    private router:Router
    ) { }

  onRegisterSubmit()
  {
    let user = {
      FirstName: this.firstname,
      LastName: this.lastname,
      Id: this.id,
      Type: this.type,
      Email: this.email,
      Password: this.password,
      StudentID: null,
      FacultyID: null,
    };

    //required fields
    if (!this.validateService.validateRegister(user)) {
      this.ngFlashMessageService.showFlashMessage({
        messages: ["Please complete all fields to register"], 
        dismissible: true, 
        timeout: false,
        type: 'danger'
      });
      return false;
    }
    if (!this.validateService.validateEmail(user.Email)) {
      this.ngFlashMessageService.showFlashMessage({
        messages: ['Please enter a valid email'], 
        dismissible: true, 
        timeout: 3000,
        type: 'danger'
      });
      return false;
    }

    if (user.Type == "faculty") {
      user.FacultyID = user.Id;
    } else {
      user.StudentID = user.Id;
    }

    // register user
    this.authService.registerUser(user).subscribe(resdata => {
      this.data = resdata; 
      if (this.data.success) {
        this.ngFlashMessageService.showFlashMessage({
          messages: ['You are now registered, You may now login'], 
          dismissible: true, 
          timeout: 3000,
          type: 'success'
        });
        this.router.navigate(['/login']);
      } else {
        this.ngFlashMessageService.showFlashMessage({
          messages: ['Error: Something went wrong, Please try again later'], 
          dismissible: true, 
          timeout: 3000,
          type: 'danger'
        });
      }
    });
  }
}
