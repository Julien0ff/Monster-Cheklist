import { Slot } from 'expo-router';

// Deliberately avoids creating a nested Stack navigator.
// Auth screens (login, signup) are controlled from the root app/_layout.tsx.
// A nested Stack would cause recursivelyTraverseLayoutEffects crashes in React 19 Fabric.
export default function AuthLayout() {
  return <Slot />;
}
