import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.css']
})
export class HelpComponent implements OnInit {

  constructor(public authSrv: AuthService) { }

  name: string;
  email: string;

  ngOnInit() {
    let user = this.authSrv.getUser();
    this.name = user.FirstName.trim() + " " + user.LastName.trim();
    this.email = user.Email.trim();
  }

  onSubmit() {
    alert("You ticket has been submitted. A Toro team staff member will contact you shortly.");
  }

}
