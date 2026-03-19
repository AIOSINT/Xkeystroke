import React, { useEffect, useMemo, useState } from "react";
import { Button, Classes, Dialog, FormGroup, Switch } from "@blueprintjs/core";

const STORAGE_KEY = "xk_legal_disclaimer_accepted_v1";

export default function LegalDisclaimerDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const hasAccepted = useMemo(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!hasAccepted) setIsOpen(true);
  }, [hasAccepted]);

  const accept = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // If storage fails (e.g., privacy mode), still allow session usage.
    }
    setIsOpen(false);
  };

  return (
    <Dialog
      isOpen={isOpen}
      title="Legal & ethical use required"
      canOutsideClickClose={false}
      canEscapeKeyClose={false}
      isCloseButtonShown={false}
      style={{ maxWidth: 720, width: "calc(100vw - 32px)" }}
    >
      <div className={Classes.DIALOG_BODY}>
        <p>
          This software is intended for lawful, authorized investigations and security work.
          You are responsible for complying with all applicable laws, regulations, and the
          terms of service of any data sources you access.
        </p>
        <p>
          Prohibited use includes (not exhaustive): harassment, doxxing, stalking, unauthorized
          access, account creation/impersonation, credential theft, or attempts to bypass
          security controls (CAPTCHA/SMS verification, fingerprinting defenses, etc.).
        </p>

        <FormGroup>
          <Switch
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.currentTarget.checked)}
            label="I understand and will use this tool only for lawful, authorized purposes."
          />
        </FormGroup>
      </div>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button intent="primary" disabled={!acknowledged} onClick={accept}>
            Continue
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

