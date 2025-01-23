import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material/material.module';
import { RouterModule } from '@angular/router';

import { Firestore, doc, deleteDoc } from '@angular/fire/firestore';

import { AuthService } from '../../auth.service';
import { Auth, deleteUser } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [CommonModule,
    MaterialModule, 
    RouterModule, ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit{
  isLoggedIn = false;
  isAdmin = false;
  firstName: string = '';

  constructor(
    private authService: AuthService,
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.isLoggedIn = true;
        this.firstName = user.displayName || 'User';  // ใช้ชื่อผู้ใช้หากมี
        this.isAdmin = user.email === 'admin@example.com';  // ตัวอย่างการตรวจสอบว่าเป็น admin หรือไม่
      } else {
        this.isLoggedIn = false;
      }
    });
  }

   // Logout method
   logout() {
    this.authService.logout().then(() => {
      // After logout, redirect to the home page
      this.router.navigate(['/home']);
      this.isLoggedIn = false;
    }).catch((error: any) => {
      console.error('Logout failed:', error);
    });
  }

  // Method to delete the user account
  deleteA() {
    const user = this.auth.currentUser;

    if (user) {
      // Step 1: Delete user data from Firestore
      const userDocRef = doc(this.firestore, `users/${user.uid}`);

      // Use async/await to handle the promises
      this.deleteAccount(userDocRef, user);
    }
  }

  // Asynchronous method to delete the account
  async deleteAccount(userDocRef: any, user: any) {
    try {
      // Step 1: Delete user data from Firestore
      await deleteDoc(userDocRef);
      console.log('User data deleted from Firestore');
      
      // Step 2: Delete the user authentication from Firebase
      await deleteUser(user);
      console.log('User deleted from Firebase Authentication');
      
      // Step 3: Redirect to home after deletion
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error during account deletion:', error);
    }
  }
  
}
