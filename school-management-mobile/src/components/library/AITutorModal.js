import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useTranslation } from 'react-i18next';
import aiService from '../../services/aiService';

const AITutorModal = ({ visible, book, onClose }) => {
  const { i18n } = useTranslation();
  const flatListRef = useRef(null);

  const [messages, setMessages] = useState([
    { text: `Hi! I'm your AI Tutor. What would you like to know about "${book?.title}"?`, sender: "ai" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, sender: "student" }]);
    setInput("");
    setIsTyping(true);

    // Smooth scroll list to end for new user entries
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await aiService.askBookQuestion({
        title: book.title,
        subject: book.subject,
        gradeLevel: book.gradeLevel,
        question: userMessage,
        language: i18n.language,
        fileUrl: book.fileUrl
      });

      setMessages(prev => [...prev, { text: response.data.answer, sender: "ai" }]);
    } catch (error) {
      setMessages(prev => [...prev, { text: "Oops! My brain froze. Try asking again! 🧠❄️", sender: "ai" }]);
    } finally {
      setIsTyping(false);
      // Smooth scroll list to end for incoming AI answers
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  // Chat Bubble Render Pipeline
  const renderMessageItem = ({ item }) => {
    const isStudent = item.sender === "student";
    return (
      <View className={`flex-row mb-3.5 ${isStudent ? "justify-end" : "justify-start"}`}>
        <View 
          className={`max-w-[82%] px-4 py-3 rounded-2xl shadow-sm ${
            isStudent 
              ? "bg-pink-600 rounded-tr-none text-white" 
              : "bg-white border border-slate-100 rounded-tl-none text-slate-800"
          }`}
          style={{ elevation: 1 }}
        >
          <Text className={`text-sm leading-5 ${isStudent ? "text-white font-medium" : "text-slate-800"}`}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  if (!book) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-slate-50">
        
        {/* Mobile Header Structure */}
        <View className="bg-pink-600 px-5 py-4 flex-row justify-between items-center shadow-md">
          <View className="flex-1 pr-4">
            <Text className="font-black text-lg text-white">🤖 AI Study Tutor</Text>
            <Text numberOfLines={1} className="text-blue-100 text-xs mt-0.5">
              Discussing: {book.title}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} className="p-1">
            <Text className="text-white font-light text-2xl">✕</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Chat Flow Core */}
        <View className="flex-1 px-4 pt-4">
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(_, index) => index.toString()}
            renderItem={renderMessageItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={
              isTyping ? (
                <View className="flex-row justify-start items-center bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none self-start shadow-sm gap-2">
                  <ActivityIndicator size="small" color="#94a3b8" />
                  <Text className="text-slate-400 text-xs font-semibold">Tutor is thinking...</Text>
                </View>
              ) : null
            }
          />
        </View>

        {/* Native Safe Keyboard Form Controller */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View className="p-3 bg-white border-t border-slate-200 flex-row items-center gap-2">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask a question..."
              placeholderTextColor="#94a3b8"
              className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-slate-800 text-sm max-h-24"
              multiline
              disabled={isTyping}
            />
            <TouchableOpacity 
              disabled={!input.trim() || isTyping} 
              onPress={handleSendMessage}
              activeOpacity={0.8}
              className={`px-5 py-3 rounded-xl justify-center items-center ${
                (!input.trim() || isTyping) ? 'bg-slate-200' : 'bg-blue-600'
              }`}
            >
              <Text className={`font-bold text-sm ${(!input.trim() || isTyping) ? 'text-slate-400' : 'text-white'}`}>
                Send
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </Modal>
  );
};

export default AITutorModal;