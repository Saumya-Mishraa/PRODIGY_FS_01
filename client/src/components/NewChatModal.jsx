import React, { useEffect, useRef, useState } from "react";
import Modal from "./Modal.jsx";
import Avatar from "./Avatar.jsx";
import api from "../services/api.js";

const NewChatModal = ({
  open,
  onClose,
  onCreated,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  const searchTimeout = useRef(null);
  const searchRequest = useRef(0);

  /*
   * Reset modal state whenever it closes.
   */
  useEffect(() => {
    if (open) return;

    setQuery("");
    setResults([]);
    setSearching(false);
    setStartingChat(false);

    clearTimeout(searchTimeout.current);
  }, [open]);

  /*
   * Clear timeout on unmount.
   */
  useEffect(() => {
    return () => {
      clearTimeout(searchTimeout.current);
    };
  }, []);

  const search = (value) => {
    setQuery(value);

    clearTimeout(searchTimeout.current);

    const trimmedQuery = value.trim();

    if (!trimmedQuery) {
      setResults([]);
      setSearching(false);
      return;
    }

    /*
     * Small debounce prevents an API request on every keystroke.
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
           * Ignore an older request if a newer
           * search has already completed.
           */
          if (
            requestId === searchRequest.current
          ) {
            setResults(data?.users || []);
          }
        } catch (error) {
          if (
            requestId === searchRequest.current
          ) {
            setResults([]);
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

  const startChat = async (userId) => {
    if (!userId || startingChat) {
      return;
    }

    setStartingChat(true);

    try {
      const { data } = await api.post(
        "/conversations/private",
        {
          userId,
        }
      );

      onCreated?.(data.conversation);

      setQuery("");
      setResults([]);

      onClose?.();
    } catch (error) {
      console.error(
        "Failed to start conversation:",
        error
      );
    } finally {
      setStartingChat(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New conversation"
    >
      <div className="w-full min-w-0">
        {/* Search Input */}
        <div className="relative">
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) =>
              search(event.target.value)
            }
            placeholder="Search by name, username or email"
            aria-label="Search people"
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
              appearance-none
            "
          />
        </div>

        {/* Search Results */}
        <div
          className="
            mt-3
            max-h-72
            sm:max-h-80
            overflow-y-auto
            overflow-x-hidden
            space-y-1
            overscroll-contain
          "
        >
          {/* Searching */}
          {searching && (
            <div className="
              flex items-center
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
            !query.trim() && (
              <div className="
                px-2
                py-4
                text-sm
                text-muted
                text-center
              ">
                Search for someone to start a conversation.
              </div>
            )}

          {/* No Results */}
          {!searching &&
            query.trim() &&
            results.length === 0 && (
              <div className="
                px-2
                py-4
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

            return (
              <button
                key={userId}
                type="button"
                disabled={startingChat}
                onClick={() =>
                  startChat(userId)
                }
                className="
                  w-full
                  flex items-center
                  gap-3
                  px-2.5
                  py-2.5
                  rounded-xl
                  text-left
                  min-w-0
                  hover:bg-white/5
                  active:bg-white/10
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  transition-colors
                "
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar
                    name={user.name}
                    src={user.avatar}
                    size={38}
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

                {/* Loading indicator */}
                {startingChat && (
                  <span className="
                    flex-shrink-0
                    text-[10px]
                    text-muted
                  ">
                    Opening…
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

export default NewChatModal;