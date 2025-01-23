import { Component, OnInit, OnDestroy } from '@angular/core';
import { Firestore, collection, getDocs, doc, updateDoc } from '@angular/fire/firestore';
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

  constructor(private firestore: Firestore, 
              private authService: AuthService) {}

  ngOnInit(): void {
    this.userSubscription = this.authService.user$.subscribe(user => {
      if (user) {
        this.authService.checkIfAdmin(user.uid).then(isAdmin => {
          this.isAdmin = isAdmin;
        });
      }
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe to avoid memory leaks
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  async fetchUsers() {
    const usersCollection = collection(this.firestore, 'users');
    const userSnapshot = await getDocs(usersCollection);
    this.users = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async editUser(userId: string) {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    // Example: Changing the firstName of the user
    await updateDoc(userDocRef, { firstName: 'New Name' });
    this.fetchUsers(); // Refresh the list after update
  }
}
