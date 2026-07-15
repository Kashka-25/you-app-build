import { Placeholder, SectionTitle } from "../Primitives";

export default function Community() {
  return (
    <div className="pt-1 pb-24 px-5">
      <SectionTitle>CommYOUnity</SectionTitle>
      <Placeholder label="post — photo" tall>card</Placeholder>
      <Placeholder label="post — voice note" tall>card</Placeholder>
      <Placeholder label="poll" tall>card</Placeholder>
      <Placeholder label="post — reflection" tall>card</Placeholder>
    </div>
  );
}
