import React, { useEffect, useRef, useState } from "react";
import Modal from "./Modal.jsx";
import Avatar from "./Avatar.jsx";
import api from "../services/api.js";

const NewGroupModal = ({
  open,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const searchTimeout = useRef(null);
  const searchRequest = useRef(0);

  /*
   * Reset the modal when it closes.
   */
  useEffect(() => {
    if (open) return;

    setName("");
    setQuery("");
    setResults([]);
    setSelected([]);
    setSearching(false);
    setCreating(false);
    setError("");

    clearTimeout(searchTimeout.current);
  }, [open]);

  /*
   * Cleanup timeout when component unmounts.
   */
  useEffect(() => {
    return () => {
      clearTimeout(searchTimeout.current);
    };
  }, []);

  const search = (value) => {
    setQuery(value);
    setError("");

    clearTimeout(searchTimeout.current);

    const trimmedQuery = value.trim();

    if (!trimmedQuery) {
      setResults([]);
      setSearching(false);
      return;
    }

    /*
     * Debounce user search to avoid
     * unnecessary API requests.
     */
    searchTimeout.current = setTimeout(
      async () => {
        const requestId =
          ++searchRequest.current;

        setSearching(true);

        try {
          const { data } = await api.get(
            `/users/search?q=${encodeURIComponent(
              trimmedQuery
            )}`
          );

          /*
           * Prevent older search requests from
           * overwriting newer results.
           */
          if (
            requestId === searchRequest.current
          ) {
            setResults(data?.users || []);
          }
        } catch (err) {
          if (
            requestId === searchRequest.current
          ) {
            setResults([]);
            setError(
              err?.response?.data?.message ||
                "Unable to search users. Please try again."
            );
          }
        } finally {
          if (
            requestId === searchRequest.current
          ) {
            setSearching(false);
          }
        }
      },
      300
    );
  };

  const toggle = (user) => {
    const userId = user.id || user._id;

    if (!userId) return;

    setSelected((prev) => {
      const exists = prev.some(
        (item) =>
          (item.id || item._id) === userId
      );

      if (exists) {
        return prev.filter(
          (item) =>
            (item.id || item._id) !== userId
        );
      }

      return [...prev, user];
    });
  };

  const removeSelected = (userId) => {
    setSelected((prev) =>
      prev.filter(
        (user) =>
          (user.id || user._id) !== userId
      )
    );
  };

  const create = async () => {
    const trimmedName = name.trim();

    if (
      !trimmedName ||
      selected.length === 0 ||
      creating
    ) {
      return;
    }

    setCreating(true);
    setError("");

    try {
      const { data } = await api.post(
        "/conversations/group",
        {
          name: trimmedName,
          memberIds: selected.map(
            (user) =>
              user.id || user._id
          ),
        }
      );

      onCreated?.(data.conversation);

      setName("");
      setSelected([]);
      setResults([]);
      setQuery("");

      onClose?.();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to create group. Please try again."
      );
    } finally {
      setCreating(false);
    }
  };

  const isSelected = (userId) =>
    selected.some(
      (user) =>
        (user.id || user._id) === userId
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create group"
    >
      <div className="w-full min-w-0">
        {/* Group Name */}
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError("");
          }}
          placeholder="Group name"
          maxLength={80}
          disabled={creating}
          className="
            w-full
            min-w-0
            bg-chat
            border border-white/5
            focus:border-ember/40
            outline-none
            rounded-full
            px-4
            py-2.5
            text-sm
            text-ink
            placeholder:text-muted
            transition-colors
            disabled:opacity-60
          "
        />

        {/* Selected Members */}
        {selected.length > 0 && (
          <div className="
            flex flex-wrap
            gap-1.5
            sm:gap-2
            mt-3
            mb-3
            max-h-28
            overflow-y-auto
            overflow-x-hidden
            p-0.5
          ">
            {selected.map((user) => {
              const userId =
                user.id || user._id;

              return (
                <button
                  key={userId}
                  type="button"
                  onClick={() =>
                    removeSelected(userId)
                  }
                  disabled={creating}
                  title={`Remove ${user.name}`}
                  className="
                    max-w-full
                    inline-flex
                    items-center
                    gap-1
                    text-xs
                    bg-ember/15
                    text-ember
                    px-2.5
                    py-1.5
                    rounded-full
                    hover:bg-ember/25
                    active:bg-ember/30
                    disabled:opacity-50
                    transition-colors
                  "
                >
                  <span className="truncate max-w-[140px] sm:max-w-[180px]">
                    {user.name}
                  </span>

                  <span
                    aria-hidden="true"
                    className="flex-shrink-0"
                  >
                    ×
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Member Search */}
        <input
          value={query}
          onChange={(event) =>
            search(event.target.value)
          }
          placeholder="Add members"
          disabled={creating}
          className="
            w-full
            min-w-0
            bg-chat
            border border-white/5
            focus:border-ember/40
            outline-none
            rounded-full
            px-4
            py-2.5
            text-sm
            text-ink
            placeholder:text-muted
            transition-colors
            disabled:opacity-60
            mt-3
          "
        />

        {/* Error */}
        {error && (
          <p className="
            text-xs
            text-red-300
            bg-red-500/10
            border border-red-500/20
            rounded-lg
            px-3
            py-2
            mt-2
          ">
            {error}
          </p>
        )}

        {/* Search Results */}
        <div className="
          max-h-48
          sm:max-h-56
          overflow-y-auto
          overflow-x-hidden
          space-y-1
          mt-3
          mb-4
          overscroll-contain
        ">
          {/* Searching */}
          {searching && (
            <div className="
              px-2
              py-3
              text-sm
              text-muted
            ">
              Searching…
            </div>
          )}

          {/* Empty Search */}
          {!searching &&
            !query.trim() &&
            selected.length === 0 && (
              <div className="
                px-2
                py-3
                text-sm
                text-muted
                text-center
              ">
                Search for people to add to your group.
              </div>
            )}

          {/* No Results */}
          {!searching &&
            query.trim() &&
            results.length === 0 && (
              <div className="
                px-2
                py-3
                text-sm
                text-muted
                text-center
              ">
                No people found.
              </div>
            )}

          {/* Users */}
          {results.map((user) => {
            const userId =
              user.id || user._id;

            const selectedUser =
              isSelected(userId);

            return (
              <button
                key={userId}
                type="button"
                onClick={() =>
                  toggle(user)
                }
                disabled={creating}
                className={`
                  w-full
                  flex items-center
                  gap-3
                  px-2.5
                  py-2.5
                  rounded-xl
                  transition-colors
                  text-left
                  min-w-0
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  ${
                    selectedUser
                      ? "bg-ember/10"
                      : "hover:bg-white/5 active:bg-white/10"
                  }
                `}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar
                    name={user.name}
                    src={user.avatar}
                    size={36}
                  />
                </div>

                {/* User Info */}
                <div className="
                  flex-1
                  min-w-0
                  overflow-hidden
                ">
                  <p className="
                    text-sm
                    font-medium
                    truncate
                  ">
                    {user.name}
                  </p>

                  <p className="
                    text-xs
                    text-muted
                    truncate
                  ">
                    @{user.username}
                  </p>
                </div>

                {/* Selection Indicator */}
                <span
                  className={`
                    flex-shrink-0
                    flex items-center
                    justify-center
                    w-5 h-5
                    rounded-full
                    border
                    text-xs
                    transition-colors
                    ${
                      selectedUser
                        ? "bg-ember border-ember text-bg"
                        : "border-white/20 text-transparent"
                    }
                  `}
                  aria-hidden="true"
                >
                  ✓
                </span>
              </button>
            );
          })}
        </div>

        {/* Create Group Button */}
        <button
          type="button"
          onClick={create}
          disabled={
            !name.trim() ||
            selected.length === 0 ||
            creating
          }
          className="
            w-full
            flex items-center
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
            disabled:opacity-40
            disabled:cursor-not-allowed
            transition-all
          "
        >
          {creating
            ? "Creating group…"
            : "Create group"}
        </button>
      </div>
    </Modal>
  );
};

export default NewGroupModal;