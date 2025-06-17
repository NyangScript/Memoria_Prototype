
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { PhoneIcon } from '../components/icons';
import { ROUTES } from '../constants';

const emergencyContacts = [
  { name: '112 (경찰)', number: '112', bgColor: 'bg-blue-500 hover:bg-blue-600' },
  { name: '119 (소방/의료)', number: '119', bgColor: 'bg-red-500 hover:bg-red-600' },
];

const ReportEmergencyPage: React.FC = () => {
  const navigate = useNavigate();
  const [address, setAddress] = useState('서울특별시 예시구 예시동 123-45'); // Default or pre-filled address
  const [selectedAddressType, setSelectedAddressType] = useState('본가');

  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <PageLayout title="긴급 신고" showBackButton={true} onBack={() => navigate(ROUTES.HOME)}>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">긴급 상황 발생 시, 즉시 신고하세요.</h2>
          <p className="text-sm text-gray-500 mb-6">버튼을 누르면 해당 번호로 바로 연결됩니다.</p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            {emergencyContacts.map(contact => (
              <button
                key={contact.number}
                onClick={() => handleCall(contact.number)}
                className={`flex flex-col items-center justify-center p-6 rounded-lg text-white font-bold text-2xl shadow-md transition-transform transform hover:scale-105 ${contact.bgColor}`}
              >
                <PhoneIcon className="w-10 h-10 mb-2" />
                {contact.name.split(' ')[0]}
                <span className="text-lg font-medium">{contact.name.split(' ')[1]}</span>
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="dispatchAddress" className="block text-sm font-medium text-gray-700 mb-1">출동 주소</label>
            <div className="flex space-x-2 mb-2">
              {['본가', '자취방', '직접입력'].map(type => (
                <button 
                  key={type}
                  onClick={() => setSelectedAddressType(type)}
                  className={`px-3 py-1 text-sm rounded-md ${selectedAddressType === type ? 'bg-sky-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  {type}
                </button>
              ))}
            </div>
            <input
              type="text"
              id="dispatchAddress"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="정확한 주소를 입력해주세요"
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
              disabled={selectedAddressType !== '직접입력'}
            />
             <p className="text-xs text-gray-500 mt-1">선택된 주소: {address}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">앱 사용 중 오류가 발생했나요?</h2>
          <p className="text-sm text-gray-500 mb-4">개발팀에 오류를 신고하여 서비스 개선에 도움을 주세요.</p>
          <button
            onClick={() => navigate(ROUTES.REPORT_ERROR)}
            className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out"
          >
            오류 신고하기
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

export default ReportEmergencyPage;
