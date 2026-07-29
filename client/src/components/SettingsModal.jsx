import React, { useEffect, useState } from "react";
import Modal from "./Modal.jsx";
import ThemeSelector from "./ThemeSelector.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

const SettingsModal = ({
  open,
  onClose,
}) => {
  const { user, setUser } = useAuth();

  const [name, setName] = useState(
    user?.name || ""
  );
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("profile");
  const [error, setError] = useState("");

  /*
   * Keep the local name field synced with
   * the latest authenticated user.
   */
  useEffect(() => {
    if (user?.name !== undefined) {
      setName(user.name);
    }
  }, [user?.name]);

  /*
   * Reset error when modal is opened again.
   */
  useEffect(() => {
    if (open) {
      setError("");
      setTab("profile");
    }
  }, [open]);

  const save = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError(
        "Display name cannot be empty."
      );
      return;
    }

    if (trimmedName === user?.name) {
      onClose?.();
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { data } = await api.patch(
        "/users/me",
        {
          name: trimmedName,
        }
      );

      setUser(data.user);
      onClose?.();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to save changes. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    {
      id: "profile",
      label: "Profile",
    },
    {
      id: "appearance",
      label: "Appearance",
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Settings"
    >
      <div className="w-full min-w-0">
        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Settings sections"
          className="
            flex
            gap-1
            mb-5
            border-b border-white/5
            overflow-x-auto
            scrollbar-none
          "
        >
          {tabs.map((tabItem) => {
            const isActive =
              tab === tabItem.id;

            return (
              <button
                key={tabItem.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() =>
                  setTab(tabItem.id)
                }
                className={`
                  relative
                  flex-shrink-0
                  px-3
                  py-2.5
                  text-sm
                  font-medium
                  transition-colors
                  ${
                    isActive
                      ? "text-ember"
                      : "text-muted hover:text-ink"
                  }
                `}
              >
                {tabItem.label}

                {isActive && (
                  <div
                    className="
                      absolute
                      bottom-0
                      left-2
                      right-2
                      h-0.5
                      bg-ember
                      rounded-full
                    "
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Profile Tab */}
        {tab === "profile" && (
          <div className="space-y-4">
            {/* Display Name */}
            <div>
              <label
                htmlFor="display-name"
                className="
                  text-xs
                  text-muted
                  mb-1.5
                  block
                "
              >
                Display name
              </label>

              <input
                id="display-name"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(
                    event.target.value
                  );
                  setError("");
                }}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    save();
                  }
                }}
                maxLength={50}
                disabled={saving}
                autoComplete="name"
                className="
                  w-full
                  min-w-0
                  bg-chat
                  border border-white/5
                  focus:border-ember/40
                  outline-none
                  rounded-xl
                  px-4
                  py-2.5
                  text-sm
                  text-ink
                  placeholder:text-muted
                  transition-colors
                  disabled:opacity-60
                "
              />
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="
                  text-xs
                  text-muted
                  mb-1.5
                  block
                "
              >
                Username
              </label>

              <input
                id="username"
                type="text"
                disabled
                readOnly
                value={
                  user?.username
                    ? `@${user.username}`
                    : ""
                }
                className="
                  w-full
                  min-w-0
                  bg-chat/50
                  border border-white/5
                  rounded-xl
                  px-4
                  py-2.5
                  text-sm
                  text-muted
                  cursor-not-allowed
                "
              />
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="
                  text-xs
                  text-red-300
                  bg-red-500/10
                  border border-red-500/20
                  rounded-lg
                  px-3
                  py-2.5
                  break-words
                "
              >
                {error}
              </div>
            )}

            {/* Save Button */}
            <button
              type="button"
              onClick={save}
              disabled={
                saving ||
                !name.trim()
              }
              className="
                w-full
                flex
                items-center
                justify-center
                gap-2
                bg-ember
                text-bg
                font-medium
                rounded-full
                py-2.5
                px-4
                text-sm
                hover:brightness-110
                active:scale-[0.99]
                transition-all
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              {saving
                ? "Saving…"
                : "Save changes"}
            </button>
          </div>
        )}

        {/* Appearance Tab */}
        {tab === "appearance" && (
          <div className="w-full min-w-0">
            <ThemeSelector />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SettingsModal;