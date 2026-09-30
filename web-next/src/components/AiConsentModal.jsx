import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { useAppData } from "../lib/AppDataContext";

// Asked the first time the Seeker reaches for an AI reflection, never
// before, and never assumed. "Not now" is a full answer: nothing is sent,
// and they'll simply be asked again next time they reach for it. Changeable
// any time in Your Own Universe.
export default function AiConsentModal() {
  const { consentPrompt, answerConsentPrompt } = useAppData();

  return (
    <Modal open={Boolean(consentPrompt)} onClose={() => answerConsentPrompt(false)} title="Before YOU reflects with you">
      <div className="space-y-3 text-body text-textSecondary mb-5">
        <p>
          To offer a reflection, YOU sends the words you've chosen to reflect on — a journal entry, a
          photographed page, your memories — to Claude, an AI made by Anthropic.
        </p>
        <p>
          They're used only to write your reflection. Anthropic doesn't use them to train its models, and
          YOU never uses them for anything else.
        </p>
        <p>
          Your words stay yours. You can change your mind any time in Your Own Universe, and YOU will stop
          sending anything straight away.
        </p>
      </div>
      <div className="flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={() => answerConsentPrompt(false)}>
          Not now
        </Button>
        <Button variant="primary" className="flex-1" onClick={() => answerConsentPrompt(true)}>
          Yes, reflect with me
        </Button>
      </div>
    </Modal>
  );
}
