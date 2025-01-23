import { Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { MyFlatComponent } from './components/flat/my-flat/my-flat.component';
import { FavouriteComponent } from './components/flat/favourite/favourite.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AllUsersComponent } from './components/all-users/all-users.component';

import { NewFlatComponent } from './components/flat/new-flat/new-flat.component';

export const routes: Routes = [
       { path: 'home', component: HomeComponent },
       { path: 'login', component: LoginComponent },
       { path: 'register', component: RegisterComponent },
       { path: 'myFlat', component: MyFlatComponent },
       { path: 'favourite', component: FavouriteComponent },
       { path: 'profile', component: ProfileComponent },
       { path: 'allUsers', component: AllUsersComponent },
       { path: 'newFlat', component: NewFlatComponent },
       { path: '', redirectTo: 'home', pathMatch: 'full' },
];

