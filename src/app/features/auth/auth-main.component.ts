import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthNavbarComponent } from './components/auth-navbar/auth-navbar.component';
import { AuthFooterComponent } from './components/auth-footer/auth-footer.component';



@Component({
  selector: 'app-auth-main',
  imports: [RouterOutlet, AuthNavbarComponent, AuthFooterComponent],
  templateUrl: './auth-main.component.html',
  styleUrl: './auth-main.component.css'
})
export class AuthMainComponent {

}
