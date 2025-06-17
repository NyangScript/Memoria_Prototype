import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { useUserProfile } from '../contexts/UserProfileContext';
import { ROUTES, DEFAULT_PATIENT_NAME } from '../constants';
import { UserCircleIcon } from '../components/icons';

const ProfileSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, isLoading } = useUserProfile();
  const [name, setName] = useState(DEFAULT_PATIENT_NAME);
  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading) {
      setName(profile.name || DEFAULT_PATIENT_NAME);
      setImagePreview(profile.image);
    }
  }, [profile, isLoading]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Basic validation for image type and size (optional)
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 선택 가능합니다 (예: JPG, PNG).');
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('이미지 파일 크기는 2MB를 초과할 수 없습니다.');
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    let newImageBase64: string | undefined = profile.image; // Keep existing if no new file
    if (selectedFile && imagePreview) { // imagePreview will hold the new base64 string
        newImageBase64 = imagePreview;
    } else if (!selectedFile && imagePreview === undefined) { // If user explicitly removed image (future feature)
        newImageBase64 = undefined;
    }


    updateProfile({ name: name.trim() || DEFAULT_PATIENT_NAME, image: newImageBase64 });

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate save delay
    
    setIsSaving(false);
    setSaveSuccess(true);
    setSelectedFile(null); // Reset selected file after saving
    setTimeout(() => {
        setSaveSuccess(false);
    }, 2500);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  if (isLoading) {
    return (
      <PageLayout title="프로필 정보 수정" showBackButton={true} onBack={() => navigate(ROUTES.SETTINGS)}>
        <div className="text-center p-10 text-gray-500">프로필 정보를 불러오는 중...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="프로필 정보 수정" showBackButton={true} onBack={() => navigate(ROUTES.SETTINGS)}>
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl max-w-md mx-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">프로필 정보</h2>
        
        <div className="space-y-6">
          <div className="flex flex-col items-center space-y-3">
            {imagePreview ? (
              <img src={imagePreview} alt="Profile Preview" className="w-32 h-32 rounded-full object-cover shadow-md border-2 border-sky-200" />
            ) : (
              <UserCircleIcon className="w-32 h-32 text-gray-300" />
            )}
            <input 
              type="file" 
              accept="image/png, image/jpeg, image/webp" 
              onChange={handleImageChange} 
              ref={fileInputRef}
              className="hidden"
              aria-labelledby="image-upload-button"
            />
            <button
              id="image-upload-button"
              type="button"
              onClick={triggerFileSelect}
              className="px-4 py-2 text-sm bg-sky-100 text-sky-700 rounded-md hover:bg-sky-200 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50"
            >
              이미지 변경
            </button>
          </div>

          <div>
            <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
              사용자 이름
            </label>
            <input
              type="text"
              id="patientName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition-colors"
              placeholder="사용자 이름 입력"
              maxLength={30}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out disabled:opacity-60 flex items-center justify-center"
            aria-live="polite"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                저장 중...
              </>
            ) : (
              '변경사항 저장'
            )}
          </button>
          {saveSuccess && (
            <p className="text-sm text-green-600 text-center mt-2" role="status">프로필이 성공적으로 업데이트되었습니다!</p>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default ProfileSettingsPage;