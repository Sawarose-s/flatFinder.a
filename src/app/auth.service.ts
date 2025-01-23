import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { Firestore, doc, setDoc, getDoc, deleteDoc, collection, getDocs } from '@angular/fire/firestore';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, fetchSignInMethodsForEmail, User  } from '@angular/fire/auth';

import { signOut } from 'firebase/auth';
import { environment } from '../environments/environment.development';
import { collectionData } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private userSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable(); // ใช้ในส่วนอื่นๆ

  favoritesSubject: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

  constructor(
    private auth: Auth, // Auth ถูก Inject ผ่าน Angular Dependency Injection
    private firestore: Firestore,
    private router: Router
    
  ) {
    // เมื่อเริ่มต้นให้ตรวจสอบผู้ใช้ที่เข้าสู่ระบบอยู่
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.userSubject.next(user); 
        this.updateFavorites(user.uid);
      }
    });
  }

   // เช็คว่าอีเมลถูกใช้แล้วหรือยัง
   async checkIfEmailExists(email: string): Promise<boolean> {
    try {
      const userMethods = await fetchSignInMethodsForEmail(this.auth, email);
      return userMethods.length > 0;  // ถ้ามีการลงทะเบียนอีเมลนี้แล้วจะมีข้อมูล
    } catch (error) {
      console.error('Error checking email existence:', error);
      return false;
    }
  }

  // ฟังก์ชันสำหรับลงทะเบียนผู้ใช้
  async register(email: string, password: string, userData: any) {
    const emailExists = await this.checkIfEmailExists(email);
    if (emailExists) {
      alert('The email is already in use. Please use a different email or log in.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const userDocRef = doc(this.firestore, `users/${userCredential.user.uid}`);
      await setDoc(userDocRef, {
        firstName: userData.firstName,
        lastName: userData.lastName,
        birthDate: userData.birthDate,
        email: userData.email
      });
      this.userSubject.next(userCredential.user); // อัพเดตสถานะผู้ใช้
      await this.router.navigate(['/home']);
    } catch (error: any) {
      console.error('Registration Error:', error);
      alert('Registration failed: ' + error.message);
    }
  }

  // ฟังก์ชันสำหรับเข้าสู่ระบบ
  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      this.userSubject.next(userCredential.user); // อัพเดตสถานะผู้ใช้
      console.log('User signed in: ', userCredential.user);
      await this.router.navigate(['/home']);
    } catch (error: any) {
      console.error('Login Error:', error);
      alert('Login failed: ' + error.message);
    }
  }

  logout(): Promise<void> {
    return signOut(this.auth);  // Returns a promise that resolves when the user is signed out
  }

  
  // Toggle favorite flat
  async toggleFavorite(flatId: string, isFavorited: boolean) {
    const user = JSON.parse(localStorage.getItem('user') || '{}'); // Assumes user info is stored in localStorage
    if (user && user.uid) {
      const favoriteDocRef = doc(this.firestore, `users/${user.uid}/favorites/${flatId}`);
      try {
        if (isFavorited) {
          await deleteDoc(favoriteDocRef);
        } else {
          await setDoc(favoriteDocRef, { flatId });
        }
        this.updateFavorites(user.uid);
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    }
  }

  async updateFavorites(uid: string) {
    const favoritesCollection = collection(this.firestore, `users/${uid}/favorites`);
    const favoritesSnapshot = await getDocs(favoritesCollection);
    const favorites = favoritesSnapshot.docs.map(doc => doc.id);
    this.favoritesSubject.next(favorites); // Update the favoritesSubject
  }

  getUserFavorites(uid: string) {
    const favoritesCollection = collection(this.firestore, `users/${uid}/favorites`);
    return collectionData(favoritesCollection, { idField: 'id' });
  }
  
    // ฟังก์ชันเช็คว่าเป็นแอดมินหรือไม่
    async checkIfAdmin(uid: string): Promise<boolean> {
      try {
        const userDocRef = doc(this.firestore, `users/${uid}`);
        const userDoc = await getDoc(userDocRef);
  
        if (userDoc.exists()) {
          const userData = userDoc.data();
          return userData?.['isAdmin'] ?? false;
        } else {
          return false; // ถ้าไม่มีเอกสารผู้ใช้ใน Firestore
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
    }

  }