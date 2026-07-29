import React, { useState } from "react";
import Modal from "./Modal.jsx";
import ThemeSelector from "./ThemeSelector.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

const SettingsModal = ({ open, onClose }) => {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("profile");

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch("/users/me", { name });
      setUser(data.user);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="flex gap-2 mb-5 relative border-b border-white/5">
        {["profile", "appearance"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-3 py-2 text-sm capitalize transition-colors ${
              tab === t ? "text-ember" : "text-muted hover:text-ink"
            }`}
          >
            {t}
            {tab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ember rounded-full" />}
          </button>
        ))}
      </div>

      {tab === "profile" ? (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted mb-1 block">Display name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-chat border border-white/5 focus:border-ember/40 outline-none rounded-xl px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Username</label>
            <input
              disabled
              value={`@${user?.username}`}
              className="w-full bg-chat/50 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-muted"
            />
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="w-full bg-ember text-bg font-medium rounded-full py-2.5 hover:brightness-110 transition disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      ) : (
        <ThemeSelector />
      )}
    </Modal>
  );
};

export default SettingsModal;
