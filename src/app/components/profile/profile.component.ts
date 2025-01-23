import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '../../material/material.module';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { updatePassword } from '@angular/fire/auth';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  isEditing = false;
  passwordFieldType = 'password';

  constructor(private fb: FormBuilder, 
    private firestore: Firestore, 
    private auth: Auth) {}

  ngOnInit() {
    this.initializeForm();
    this.listenToAuthState();
  }

  initializeForm() {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      birthDate: [{ value: '', disabled: true }, Validators.required],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  listenToAuthState() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.loadUserData(user.uid); // Load user data when logged in
      } else {
        console.log('User is not logged in');
      }
    });
  }

  async loadUserData(userId: string) {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      this.profileForm.patchValue(userData); // เติมข้อมูลจาก Firebase
    } else {
      console.error('No user data found in Firestore');
    }
  }

  edit() {
    this.isEditing = true;
    this.profileForm.enable(); // เปิดให้แก้ไข
    this.profileForm.controls['email'].disable(); // Email ควรเป็น readonly เสมอ
    this.profileForm.get('birthDate')?.disable(); // Birth Date always read-only
  }

  async save() {
    if (this.profileForm.valid) {
      const user = this.auth.currentUser;

      if (user) {
        const userDocRef = doc(this.firestore, `users/${user.uid}`);
        const updatedData = this.profileForm.value;

        try {
          // อัปเดตข้อมูลใน Firestore
          await setDoc(userDocRef, this.profileForm.value, { merge: true });
          // อัปเดตรหัสผ่านใน Firebase Authentication
        if (updatedData.password) {
          await updatePassword(user, updatedData.password);
        }
          console.log('User data and password updated successfully');
          this.isEditing = false; // Exit editing mode
          this.profileForm.disable(); // ปิดการแก้ไข
          this.profileForm.controls['email'].disable(); // Email คงเป็น readonly
        } catch (error) {
          console.error('Error updating user data:', error);
        }
      }
    }
  }

  togglePasswordVisibility() {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }
}
