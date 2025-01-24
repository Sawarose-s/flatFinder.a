import { Component, OnInit, OnDestroy } from '@angular/core';
import { Firestore, collection, getDocs, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { AuthService } from '../../auth.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-all-users',
  imports: [CommonModule],
  templateUrl: './all-users.component.html',
  styleUrls: ['./all-users.component.css']
})
export class AllUsersComponent implements OnInit, OnDestroy {
  users: any[] = [];
  isAdmin: boolean = false;

  private userSubscription!: Subscription;

  constructor(private firestore: Firestore, private authService: AuthService) {}

  ngOnInit(): void {
    // ตรวจสอบสถานะผู้ใช้และสิทธิ์ Admin
    this.userSubscription = this.authService.user$.subscribe((user) => {
      if (user) {
        this.authService.checkIfAdmin(user.uid).then((isAdmin) => {
          this.isAdmin = isAdmin;
          if (this.isAdmin) {
            this.fetchUsers(); // Fetch all users if admin
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe เพื่อป้องกัน memory leak
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  // ดึงข้อมูลผู้ใช้ทั้งหมดจาก Firestore
  async fetchUsers() {
    const usersCollection = collection(this.firestore, 'users');
    const userSnapshot = await getDocs(usersCollection);
    this.users = userSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  // แก้ไขข้อมูลผู้ใช้ (ตัวอย่าง: เปลี่ยนชื่อ)
  async editUser(userId: string) {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    const newName = prompt('Enter new first name:');
    if (newName) {
      await updateDoc(userDocRef, { firstName: newName });
      this.fetchUsers(); // Refresh the list
    }
  }

  // เพิ่มหรือลบสิทธิ์ Admin
  async toggleAdmin(userId: string, makeAdmin: boolean) {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    await updateDoc(userDocRef, { isAdmin: makeAdmin });
    this.fetchUsers(); // Refresh the list
  }

  // ลบบัญชีผู้ใช้
  async deleteUser(userId: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      const userDocRef = doc(this.firestore, `users/${userId}`);
      await deleteDoc(userDocRef);
      this.fetchUsers(); // Refresh the list
    }
  }
}