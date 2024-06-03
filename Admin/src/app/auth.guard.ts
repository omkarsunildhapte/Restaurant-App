import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject (Router);
  if (typeof localStorage !== 'undefined') {
    let authtoken = localStorage.getItem('accessToken');
    if(!authtoken){
      router.navigate(['/login'])
      return false;
    } 
  }
  return true;
};
