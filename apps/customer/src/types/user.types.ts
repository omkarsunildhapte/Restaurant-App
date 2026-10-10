/** The signed-in customer's profile, read from the Supabase auth user. */
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  phoneNumber: string;
}

/** Account-information form values. */
export interface AccountForm {
  displayName: string;
  email: string;
  phoneNumber: string;
}
