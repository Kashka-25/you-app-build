import { BackRow, SectionTitle, Placeholder } from "../Primitives";

export default function Atlas() {
  const regions = ["Mind", "Body", "Spirit", "Relationships", "Creativity", "Purpose"];
  return (
    <div className="pt-1 pb-24 px-5">
      <BackRow />
      <SectionTitle>Living atlas</SectionTitle>
      <Placeholder label="the living landscape" className="min-h-[240px]">
        Signature feature. Regions = life areas, grow greener as areas develop.
      </Placeholder>
      <div className="grid grid-cols-2 gap-3">
        {regions.map(r => <Placeholder key={r} label={r.toLowerCase()}>region</Placeholder>)}
      </div>
    </div>
  );
}
