import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material/material.module';
import { RouterModule } from '@angular/router';

import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  imports: [CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  submitted = false;
  showSpinner = false;
  passwordFieldType: string = 'password';

  loginForm = new FormGroup({
    email: new FormControl<string | null>('', [
      Validators.required,
      Validators.email
    ]),
    password: new FormControl<string | null>('', [
      Validators.required,
      Validators.minLength(6),
      Validators.pattern('^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\d\s]).{5,}$')
    ]),
  });

  constructor(private auth: Auth, private router: Router) {}

  onSubmit(){
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      signInWithEmailAndPassword(this.auth, email!, password!)
        .then(() => {
          console.log('Login successful');
          this.router.navigate(['/home']);
        })
        .catch((error) => {
          console.error('Login failed:', error);
          if (error.code === 'auth/wrong-password') {
            alert('Incorrect password. Please try again.');
          } else if (error.code === 'auth/user-not-found') {
            alert('User not found. Please check your email.');
          }
        });
    }
  }

  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  async loginAdmin() {
    const adminEmail = 'user@mail.com';
    const adminPassword = 'user@11';
  
    try {
      await signInWithEmailAndPassword(this.auth, adminEmail, adminPassword);
      console.log('Admin logged in successfully');
      // Redirect or perform further actions
    } catch (error) {
      console.error('Login failed: ', error);
    }
  }
}

