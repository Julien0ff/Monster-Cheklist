import { Redirect } from 'expo-router';

// Signup n'est plus nécessaire avec Discord OAuth.
// Redirige vers login.
export default function SignupRedirect() {
  return <Redirect href="/auth/login" />;
}
