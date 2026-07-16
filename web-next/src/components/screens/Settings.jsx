import { ParkedScreen, Placeholder } from "../Primitives";

export default function Settings() {
  return (
    <ParkedScreen title="Settings & Account" note="future — design direction only">
      <Placeholder label="account">Profile info, email, password</Placeholder>
      <Placeholder label="preferences">Notifications, privacy, data export</Placeholder>
      <Placeholder label="sign out">repeat</Placeholder>
    </ParkedScreen>
  );
}
