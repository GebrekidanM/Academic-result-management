import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image, 
  Alert, 
  Modal,
  Platform
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

// Custom/Shared Project Services Hooks
import libraryService from '../../src/services/libraryService';
import authService from '../../src/services/authService';

// Target Modal View Adaptations
import AITutorModal from '../../src/components/library/AITutorModal';
import FullScreenReader from '../../src/components/library/FullScreenReader';

const LibraryPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  
  const [currentUser] = useState(authService.getCurrentUser());
  
  // --- Data State ---
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- Filter State ---
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [readingBook, setReadingBook] = useState(null); 
  
  // --- Form & UI State ---
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadData, setUploadData] = useState({ 
    title: '', 
    type: 'Book', 
    gradeLevel: '', 
    subject: '', 
    file: null,    
    cover: null    
  });

  const MAX_FILE_SIZE = 15 * 1024 * 1024;

  // --- PICKERS FOR MOBILE ATTACHMENTS ---
  const pickDocumentFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedFile = result.assets[0];
        setUploadData(prev => ({ ...prev, file: selectedFile }));
        setUploadError('');
      }
    } catch (err) {
      console.error("Document picking error: ", err);
    }
  };

  const pickCoverImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(t('error'), "Permission to access camera roll is required!");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedCover = result.assets[0];
        setUploadData(prev => ({ ...prev, cover: selectedCover }));
        setUploadError('');
      }
    } catch (err) {
      console.error("Image picking error: ", err);
    }
  };

  useEffect(() => {
    const fetchLib = async () => {
      try {
        const res = await libraryService.getAll();
        setResources(res.data.data || []);
      } catch (err) { 
        console.error("Error loading library:", err); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchLib();
  }, []);

  useEffect(() => {
    let result = resources;
    if (filterGrade) result = result.filter(r => r.gradeLevel === filterGrade);
    if (filterSubject) result = result.filter(r => r.subject.toLowerCase().includes(filterSubject.toLowerCase()));
    if (searchTerm) result = result.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredResources(result);
  }, [filterGrade, filterSubject, searchTerm, resources]);

  // --- UPLOAD HANDLER ---
  const handleUpload = async () => {
    setUploadError(''); 
    
    if (!uploadData.title.trim() || !uploadData.gradeLevel.trim() || !uploadData.subject.trim()) {
      setUploadError("Please fill out all text fields.");
      return;
    }

    if (!uploadData.file) {
      setUploadError("Please select a main document file (PDF).");
      return;
    }

    if (uploadData.file.size && uploadData.file.size > MAX_FILE_SIZE) {
      setUploadError(`File is too large. Maximum size is 15MB.`);
      return;
    }

    if (uploadData.cover && uploadData.cover.size && uploadData.cover.size > 5 * 1024 * 1024) {
      setUploadError(`Cover image must be under 5MB.`);
      return;
    }

    // React Native Multi-part Form Data Parsing Rules
    const formData = new FormData();
    formData.append('title', uploadData.title);
    formData.append('type', uploadData.type);
    formData.append('gradeLevel', uploadData.gradeLevel);
    formData.append('subject', uploadData.subject);
    
    formData.append('file', {
      uri: Platform.OS === 'ios' ? uploadData.file.uri.replace('file://', '') : uploadData.file.uri,
      name: uploadData.file.name || 'document.pdf',
      type: 'application/pdf'
    });
    
    if (uploadData.cover) {
      const uriParts = uploadData.cover.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      formData.append('cover', {
        uri: Platform.OS === 'ios' ? uploadData.cover.uri.replace('file://', '') : uploadData.cover.uri,
        name: `cover.${fileType}`,
        type: `image/${fileType}`
      });
    }

    setUploading(true);
    try {
      const res = await libraryService.upload(formData);
      setResources([res.data.data, ...resources]);
      
      setShowUpload(false);
      setUploadData({ title: '', type: 'Book', gradeLevel: '', subject: '', file: null, cover: null });
    } catch (err) {
      console.error(err);
      setUploadError(t('error') || "Upload failed. Please check your network.");
    } finally {
      setUploading(false);
    }
  };

  // --- DELETE HANDLER ---
  const handleDelete = async (id) => {
    Alert.alert(
      t('delete_confirm_title') || "Confirm Delete",
      t('delete_confirm') || "Are you sure you want to delete this resource?",
      [
        { text: t('cancel') || "Cancel", style: "cancel" },
        { 
          text: t('delete') || "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await libraryService.remove(id);
              setResources(resources.filter(r => r._id !== id));
            } catch(err) { 
              Alert.alert(t('error') || "Error", t('failed_delete') || "Failed to delete."); 
            }
          }
        }
      ]
    );
  };

  const getFileUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; 
    const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001'; 
    return `${SERVER_URL}${path}`;
  };

  const canUpload = ['admin', 'teacher', 'staff'].includes(currentUser?.role);
  const gradeOptions = [
    ...[1,2,3,4,5,6,7,8,9,10,11,12].map(g => `Grade ${g}`),
    "KG 1",
    "KG 2"
  ];

  return (
    <ScrollView className="flex-1 bg-slate-50 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
      
      {/* Header View Block */}
      <View className="flex-row justify-between items-center mb-6 mt-2">
        <Text className="text-2xl font-black text-slate-800">📚 {t('school_library')}</Text>
        {canUpload && (
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => setShowUpload(!showUpload)} 
            className="bg-pink-600 px-4 py-2 rounded-xl flex-row items-center shadow-md shadow-pink-600/20"
          >
            <Text className="text-white font-extrabold text-sm mr-1">{showUpload ? '−' : '+'}</Text>
            <Text className="text-white font-bold text-xs">{t('upload_resource')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter System Layout Wrapper */}
      <View className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 gap-3">
        <TextInput 
          placeholder={t('search_title') || "Search title..."} 
          value={searchTerm} 
          onChangeText={setSearchTerm} 
          className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-800 text-sm" 
          placeholderTextColor="#94a3b8"
        />
        
        <View className="flex-row gap-3">
          {/* Native Inline Picker Row for Mobile UX */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 py-1">
            <TouchableOpacity 
              onPress={() => setFilterGrade('')} 
              className={`px-3 py-1.5 rounded-lg border ${filterGrade === '' ? 'bg-pink-50 border-pink-200' : 'bg-white border-slate-200'}`}
            >
              <Text className={`text-xs font-bold ${filterGrade === '' ? 'text-pink-600' : 'text-slate-600'}`}>{t('all_grades')}</Text>
            </TouchableOpacity>
            {gradeOptions.map(g => (
              <TouchableOpacity 
                key={g} 
                onPress={() => setFilterGrade(g)} 
                className={`px-3 py-1.5 rounded-lg border ${filterGrade === g ? 'bg-pink-50 border-pink-200' : 'bg-white border-slate-200'}`}
              >
                <Text className={`text-xs font-bold ${filterGrade === g ? 'text-pink-600' : 'text-slate-600'}`}>{g}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TextInput 
          placeholder={t('filter_subject') || "Filter by Subject"} 
          value={filterSubject} 
          onChangeText={setFilterSubject} 
          className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-800 text-sm" 
          placeholderTextColor="#94a3b8"
        />
      </View>

      {/* Upload Form Section */}
      {showUpload && (
        <View className="bg-pink-50/60 p-5 rounded-2xl border border-pink-100 mb-6 shadow-inner">
          <Text className="font-black text-base mb-4 text-pink-900 border-b border-pink-100 pb-2">{t('upload_new_material')}</Text>
          
          <View className="gap-3 mb-4">
            <View>
              <Text className="text-[10px] font-black text-slate-500 uppercase mb-1">Title</Text>
              <TextInput className="bg-white border border-slate-200 p-3 rounded-xl text-sm" value={uploadData.title} onChangeText={text => setUploadData({...uploadData, title: text})} placeholder="e.g. Biology Chapter 1" />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-[10px] font-black text-slate-500 uppercase mb-1">Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5">
                  {['Book', 'Teacher Note', 'Worksheet', 'Other'].map(type => (
                    <TouchableOpacity 
                      key={type} 
                      onPress={() => setUploadData({...uploadData, type})}
                      className={`px-3 py-2 rounded-xl border ${uploadData.type === type ? 'bg-pink-600 border-pink-600' : 'bg-white border-slate-200'}`}
                    >
                      <Text className={`text-xs font-bold ${uploadData.type === type ? 'text-white' : 'text-slate-600'}`}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-[10px] font-black text-slate-500 uppercase mb-1">{t('grade')}</Text>
                <TextInput className="bg-white border border-slate-200 p-3 rounded-xl text-sm" value={uploadData.gradeLevel} onChangeText={text => setUploadData({...uploadData, gradeLevel: text})} placeholder="e.g. Grade 4" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-black text-slate-500 uppercase mb-1">{t('subject')}</Text>
                <TextInput className="bg-white border border-slate-200 p-3 rounded-xl text-sm" value={uploadData.subject} onChangeText={text => setUploadData({...uploadData, subject: text})} placeholder="e.g. Mathematics" />
              </View>
            </View>

            {/* Mobile File Inputs Buttons */}
            <View className="gap-2.5 mt-2">
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={pickCoverImage}
                className="w-full bg-white border border-dashed border-pink-300 p-4 rounded-xl items-center justify-center"
              >
                <Text className="text-xs font-bold text-pink-700">
                  {uploadData.cover ? "✅ Cover Image Selected" : "🖼️ Choose Cover Image (Optional)"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={pickDocumentFile}
                className="w-full bg-white border border-dashed border-emerald-400 p-4 rounded-xl items-center justify-center"
              >
                <Text className="text-xs font-bold text-emerald-800">
                  {uploadData.file ? `✅ ${uploadData.file.name.slice(0, 24)}...` : "📄 Select Main PDF Document *"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {uploadError ? (
            <View className="bg-red-50 p-3 rounded-xl mb-4 border border-red-100">
              <Text className="text-red-600 font-medium text-xs">⚠️ {uploadError}</Text>
            </View>
          ) : null}

          <TouchableOpacity 
            disabled={uploading} 
            onPress={handleUpload}
            className="w-full bg-emerald-600 py-3.5 rounded-xl items-center shadow-md shadow-emerald-700/10 disabled:opacity-50"
          >
            {uploading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-white font-black text-sm">{t('submit_upload')}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Resource Grid Layout Container */}
      {loading ? (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-slate-400 text-xs font-bold mt-2 animate-pulse">{t('loading')}</Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-4 justify-between">
          {filteredResources.map(item => {
            const hasCover = !!item.coverUrl;
            return (
              <View 
                key={item._id} 
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden w-[47%] mb-1"
                style={{ elevation: 1 }}
              >
                {/* Media Cover Image Block */}
                <View className="h-32 bg-slate-100 items-center justify-center relative">
                  {hasCover ? (
                    <Image 
                      source={{ uri: getFileUrl(item.coverUrl) }} 
                      className="w-full h-full object-cover" 
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-4xl opacity-40">
                      {item.type === 'Book' ? '📖' : item.type === 'Teacher Note' ? '📝' : '📄'}
                    </Text>
                  )}
                  <View className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 rounded">
                    <Text className="text-[8px] font-black text-white uppercase">{item.type}</Text>
                  </View>
                </View>

                {/* Details Meta Field Layout */}
                <View className="p-3 flex-1 justify-between">
                  <View>
                    <View className="flex-row mb-1">
                      <Text className="text-[8px] font-bold text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded uppercase border border-pink-100/50">
                        {item.subject}
                      </Text>
                    </View>
                    <Text numberOfLines={2} className="font-extrabold text-slate-800 text-xs leading-4 mb-0.5">
                      {item.title}
                    </Text>
                    <Text className="text-[10px] text-slate-400 font-semibold mb-2">{item.gradeLevel}</Text>
                  </View>

                  <View className="border-t border-slate-50 pt-2 mt-2">
                    <View className="flex-row justify-between items-center text-[8px] text-slate-400 mb-2">
                      <Text className="text-[8px] text-slate-400 font-medium max-w-[50%]" numberOfLines={1}>
                        {item.uploadedBy?.fullName?.split(' ')[0] || 'Admin'}
                      </Text>
                      <Text className="text-[8px] text-slate-400 font-medium">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>

                    <View className="flex-row gap-1">
                      <TouchableOpacity 
                        onPress={() => setReadingBook(item)}
                        className="flex-1 bg-pink-600 py-2 rounded-lg items-center justify-center flex-row shadow-sm shadow-pink-600/10"
                      >
                        <Text className="text-white text-[10px] font-black">Read</Text>
                      </TouchableOpacity>

                      {(currentUser?.role === 'admin' || currentUser?._id === item.uploadedBy?._id) && (
                        <TouchableOpacity 
                          onPress={() => handleDelete(item._id)}
                          className="px-2.5 bg-red-50 rounded-lg justify-center items-center border border-red-100"
                        >
                          <Text className="text-red-500 text-xs">🗑️</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Native Dynamic Empty State Handler */}
      {!loading && filteredResources.length === 0 && (
        <View className="items-center justify-center py-16 gap-1">
          <Text className="text-5xl mb-2">📂</Text>
          <Text className="text-slate-600 font-extrabold text-sm">No resources found.</Text>
          <Text className="text-slate-400 text-xs text-center px-6">Try adjusting filters or upload a new book.</Text>
        </View>
      )}

      {/* Reader Lifecycle View Mount Layer */}
      {readingBook && (
        <Modal 
          visible={!!readingBook} 
          animationType="slide" 
          onRequestClose={() => setReadingBook(null)}
        >
          <FullScreenReader 
            book={readingBook} 
            onClose={() => setReadingBook(null)} 
          />
        </Modal>
      )}
    </ScrollView>
  );
};

export default LibraryPage;