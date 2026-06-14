import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import aiService from "../../services/aiService";
import { COLORS } from "../../utils/theme";

export default function AskAIChat({ semesterName, subjects }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();

    setMessages((prev) => [
      ...prev,
      { text: userMessage, sender: "parent" },
    ]);

    setInput("");
    setIsTyping(true);

    try {
      const response = await aiService.askSemesterQuestion({
        semester: semesterName,
        analytics: subjects,
        question: userMessage,
        language: "en",
      });

      setMessages((prev) => [
        ...prev,
        {
          text: response.data.answer,
          sender: "ai",
        },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, I had trouble analyzing that. Please try again.",
          sender: "system",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <View
      className="mt-6 bg-slate-50 rounded-2xl overflow-hidden"
      style={{
        borderWidth: 1,
        borderColor: COLORS.border,
        height: 420,
      }}
    >
      {/* HEADER */}
      <View
        className="flex-row items-center px-4 py-3"
        style={{
          backgroundColor: "#f1f5f9",
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <Text className="text-xl mr-2">🤖</Text>

        <Text
          className="font-bold"
          style={{ color: COLORS.textPrimary }}
        >
          Ask questions about this report
        </Text>
      </View>

      {/* CHAT AREA */}
      <ScrollView
        className="flex-1 px-4 py-3"
        contentContainerStyle={{ gap: 12 }}
      >
        {messages.length === 0 && (
          <Text
            className="text-center mt-10"
            style={{ color: COLORS.textSecondary }}
          >
            e.g. Why did my child's math grade drop?
          </Text>
        )}

        {messages.map((msg, index) => (
          <View
            key={index}
            className={`${
              msg.sender === "parent"
                ? "items-end"
                : "items-start"
            }`}
          >
            <View
              className="p-3 rounded-2xl max-w-[85%]"
              style={{
                backgroundColor:
                  msg.sender === "parent"
                    ? "#4f46e5"
                    : msg.sender === "system"
                    ? "#fef2f2"
                    : "#ffffff",

                borderWidth:
                  msg.sender === "ai" ||
                  msg.sender === "system"
                    ? 1
                    : 0,

                borderColor:
                  msg.sender === "system"
                    ? "#fecaca"
                    : COLORS.border,
              }}
            >
              <Text
                style={{
                  color:
                    msg.sender === "parent"
                      ? "#ffffff"
                      : msg.sender === "system"
                      ? "#dc2626"
                      : COLORS.textPrimary,
                }}
              >
                {msg.text}
              </Text>
            </View>
          </View>
        ))}

        {isTyping && (
          <View className="items-start">
            <View
              className="bg-white rounded-2xl p-3"
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* INPUT AREA */}
      <View
        className="flex-row items-center gap-2 p-3"
        style={{
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          backgroundColor: "#fff",
        }}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask a question..."
          editable={!isTyping}
          className="flex-1 px-4 py-3 rounded-xl"
          style={{
            backgroundColor: "#f8fafc",
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        />

        <TouchableOpacity
          onPress={handleSendMessage}
          disabled={!input.trim() || isTyping}
          className="px-4 py-3 rounded-xl"
          style={{
            backgroundColor: !input.trim() || isTyping
              ? "#94a3b8"
              : "#4f46e5",
          }}
        >
          <Text className="text-white font-bold">
            Send
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}