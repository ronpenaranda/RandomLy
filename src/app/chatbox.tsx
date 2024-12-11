"use client";
import React, { useEffect, useState } from "react";
import supabase from "@/db/supabase";

interface Message {
  id: number;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
}

interface chatProps {
    sender_id: string;
}

const ChatComponent: React.FC<chatProps> = ({ sender_id }) => {
  const [receiver_id, setReceiver_id] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const MESSAGES_PER_PAGE = 10;

  const fetchMessages = async (
    limit: number,
    offset: number
  ): Promise<void> => {
    setLoading(true);
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("sender_id", sender_id)
      .eq("receiver_id", receiver_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    setLoading(false);

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    if (data && data.length > 0) {
      setMessages((prev) => [...data.reverse(), ...prev]);
    }
  };

  const subscribeToMessages = (): (() => void) => {
    const channel = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as Message;
          console.log("New message received:", newMsg);

          if (
            (newMsg.sender_id === sender_id &&
              newMsg.receiver_id === receiver_id) ||
            (newMsg.sender_id === receiver_id &&
              newMsg.receiver_id === sender_id)
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const sendMessage = async (content: string): Promise<void> => {
    if (!content.trim() || !sender_id || !receiver_id) return;

    const { error } = await supabase
      .from("messages")
      .insert([{ content, sender_id, receiver_id }]);

    if (error) {
      console.error("Error sending message:", error);
    }
  };

  useEffect(() => {
    if (status === "onchat" && sender_id && receiver_id) {
      fetchMessages(MESSAGES_PER_PAGE, 0);
    }

    const unsubscribe = subscribeToMessages();
    return unsubscribe;
  }, [sender_id, receiver_id, status]);

  useEffect(() => {
    const container = document.querySelector(".messages-list");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const setStatusToQueue = async (id: string, status: string): Promise<void> => {
    setStatus(status)
    const { error } = await supabase
      .from("temp_user")
      .update({ status: status }) 
      .eq("id", id); 
  
    if (error) {
      console.error(`Error updating user with id ${id}:`, error);
    } else {
      console.log(`User with id ${id} has been set to inactive.`);
    }
  };

  const setActiveFalseById = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("temp_user")
      .update({ active: false }) 
      .eq("id", id); 
  
    if (error) {
      console.error(`Error updating user with id ${id}:`, error);
    } else {
      console.log(`User with id ${id} has been set to inactive.`);
    }
  };

  const getRandomActiveUsers = async (): Promise<void> => {
    const fetchActiveUsers = async (): Promise<void> => {
      // Set current user status to "queue"
      await setStatusToQueue(sender_id, "queue");
  
      const { data: activeUsers, error } = await supabase
        .from("temp_user")
        .select("*")
        .eq("active", true)
        .eq("status", "queue")
        .neq("id", sender_id);
  
      if (error) {
        console.error("Error fetching active users:", error);
        return;
      }
  
      if (!activeUsers || activeUsers.length === 0) {
        console.log("No active users found. Retrying in 3 seconds...");
        setTimeout(fetchActiveUsers, 3000); // Retry after 3 seconds
        return;
      }
  
      // Randomly select a user from the active queue
      const randomIndex = Math.floor(Math.random() * activeUsers.length);
      const randomUser = activeUsers[randomIndex];
  
      // Set the receiver and update statuses
      setReceiver_id(`${randomUser?.id}`);
      await setStatusToQueue(`${randomUser?.id}`, "onchat");
  
      console.log(`Connected to user with ID: ${randomUser?.id}`);
    };
  
    // Start fetching active users
    await fetchActiveUsers();
  };
  

  const getMessageClass = (senderId: string) => {
    return senderId === sender_id
      ? "bg-white text-black self-end"
      : "bg-gray-300 text-black self-start";
  };

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      sendMessage("other party disconnected")
      setActiveFalseById(sender_id)
      console.log("Browser is being refreshed or tab is closing.");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <div className="chat-container w-full h-full mx-auto p-4">
    {status === "queue" ? <div>Finding someone to chat...</div> : (
      <div className="messages-list space-y-2 overflow-y-auto max-h-[580px] h-screen">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message p-2 rounded shadow-sm ${getMessageClass(
              msg.sender_id
            )}`}
          >
            <p className="text-gray-800">{msg.content}</p>
            <small className="text-gray-500 text-sm">
              {new Date(msg.created_at).toLocaleTimeString()}
            </small>
          </div>
        ))}
      </div>
    )}
      <div className="send-message bg-gray-100 mt-4 p-4 rounded-xl">
        <div className="flex gap-2">
        <button
          className="bg-slate-500 text-white rounded-lg w-[250px]"
          onClick={() => {
            getRandomActiveUsers()
          }}
        >
          find chat
        </button>
        <input
          type="text"
          placeholder="Type a message..."
          className="rounded-lg p-6 w-full focus:outline-none"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        </div>
        <button
          className="bg-slate-500 text-white px-4 py-2 rounded-lg mt-2 w-full h-[50px]"
          onClick={() => {
            sendMessage(newMessage);
            setNewMessage("");
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatComponent;