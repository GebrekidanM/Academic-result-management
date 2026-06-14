import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { WebView } from 'react-native-webview';
import AITutorModal from './AITutorModal';

const FullScreenReader = ({ book, onClose }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(true);

  if (!book) return null;

  const getCleanPdfUrl = (url) => {
    if (!url) return '';
    const encodedUrl = encodeURIComponent(url);
    return `https://docs.google.com/gview?embedded=true&url=${encodedUrl}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      
      {/* 1. TOP NAVBAR CONTAINER */}
      <View className="bg-white px-4 py-3 flex-row justify-between items-center shadow-md z-10">
        
        {/* Back Button */}
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={onClose} 
          className="flex-row items-center p-2 rounded-xl"
        >
          <Text className="text-xl text-slate-600 font-bold mr-1">←</Text>
          <Text className="text-slate-600 font-bold text-xs hidden sm:flex">Back</Text>
        </TouchableOpacity>

        {/* Book Metadata Badge */}
        <View className="items-center flex-1 px-2">
          <Text numberOfLines={1} className="font-black text-slate-800 text-sm text-center">
            {book.title}
          </Text>
          <Text className="text-[9px] font-black text-pink-600 mt-0.5 uppercase tracking-wide">
            {book.subject} • {book.gradeLevel}
          </Text>
        </View>

        {/* 🌟 ASK AI BUTTON 🌟 */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => setIsChatOpen(true)}
          className="bg-pink-600 px-3.5 py-2 rounded-xl flex-row items-center"
        >
          <Text className="text-sm mr-1">🤖</Text>
          <Text className="text-white font-extrabold text-xs">Ask AI</Text>
        </TouchableOpacity>
      </View>

      {/* 2. PDF VIEWER INTERFACE EMBED */}
      <View className="flex-1 bg-slate-600 relative">
        <WebView
          source={{ uri: getCleanPdfUrl(book.fileUrl) }}
          className="flex-1"
          onLoadEnd={() => setIsPdfLoading(false)}
          startInLoadingState={true}
          scalesPageToFit={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
        
        {/* Loading Indicator Spinner Overlay */}
        {isPdfLoading && (
          <View style={StyleSheet.absoluteFillObject} className="bg-slate-100 items-center justify-center">
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text className="text-slate-400 text-xs font-bold mt-3 animate-pulse">
              Opening learning document...
            </Text>
          </View>
        )}
      </View>

      {/* 3. AI CHAT OVERLAY LIFECYCLE TARGET */}
      <AITutorModal 
        visible={isChatOpen}
        book={book} 
        onClose={() => setIsChatOpen(false)} 
      />

    </SafeAreaView>
  );
};

export default FullScreenReader;